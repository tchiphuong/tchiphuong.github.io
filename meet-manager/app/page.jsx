"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Alert, AlertDialog, Button, Card, Chip, Input, Link as HeroLink, Separator } from "@heroui/react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const ERROR_TEXT = {
  "This link is already in use": "Link đang được thành viên khác sử dụng.",
  "You are already a member": "Mày đã là thành viên của nhóm này.",
  "Request not found or permission denied": "Không tìm thấy yêu cầu hoặc mày không có quyền duyệt.",
};

function messageOf(error) {
  const raw = error?.message || "Có lỗi không xác định.";
  return ERROR_TEXT[raw] || raw;
}

function Field({ label, ...props }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
      {label}
      <Input {...props} variant="secondary" fullWidth />
    </label>
  );
}

function Notice({ notice }) {
  if (!notice) return null;
  return (
    <Alert status={notice.type || "default"} className="mb-5">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{notice.type === "danger" ? "Có lỗi xảy ra" : notice.type === "success" ? "Thành công" : "Thông báo"}</Alert.Title>
        <Alert.Description>{notice.message}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [links, setLinks] = useState([]);
  const [locks, setLocks] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [linkHistory, setLinkHistory] = useState([]);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [joinGroupCode, setJoinGroupCode] = useState("");  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const user = session?.user ?? null;
  const isOwner = selectedGroup?.owner_id === user?.id;

  const refreshWorkspace = useCallback(async (currentUser) => {
    if (!currentUser) {
      setGroups([]);
      setSelectedGroup(null);
      return;
    }

    const membershipResult = await supabase.from("group_members").select("group_id, role, groups(id, name, owner_id)").eq("user_id", currentUser.id);

    const firstError = membershipResult.error;
    if (firstError) {
      setNotice({ type: "danger", message: messageOf(firstError) });
      return;
    }

    const memberGroups = (membershipResult.data || [])
      .map((item) => ({ ...item.groups, role: item.role }))
      .filter(Boolean);
    setGroups(memberGroups);

    setSelectedGroup((current) => {
      if (current && memberGroups.some((group) => group.id === current.id)) {
        return memberGroups.find((group) => group.id === current.id);
      }
      return memberGroups[0] || null;
    });
  }, []);

  const refreshGroup = useCallback(async (group) => {
    if (!group || !user) {
      setLinks([]);
      setLocks([]);
      setMembers([]);
      setRequests([]);
      setLinkHistory([]);
      return;
    }

    const [linkResult, lockResult, memberResult, requestResult] = await Promise.all([
      supabase.from("links").select("*").eq("group_id", group.id).order("created_at", { ascending: false }),
      supabase.from("link_locks").select("*").gt("expires_at", new Date().toISOString()),
      supabase.from("group_members").select("user_id, role, joined_at").eq("group_id", group.id).order("joined_at"),
      supabase.from("group_join_requests").select("*").eq("group_id", group.id).eq("status", "pending").order("requested_at", { ascending: true }),
    ]);

    const firstError = [linkResult, lockResult, memberResult].find((result) => result.error)?.error;
    if (firstError) {
      setNotice({ type: "danger", message: messageOf(firstError) });
      return;
    }

    const linkRows = linkResult.data || [];
    const linkIds = linkRows.map((item) => item.id);
    const lockRows = (lockResult.data || []).filter((item) => linkIds.includes(item.link_id));
    const memberRows = memberResult.data || [];
    const profileIds = [...new Set([
      ...memberRows.map((item) => item.user_id),
      ...lockRows.map((item) => item.user_id),
      ...(requestResult.data || []).map((item) => item.user_id),
    ])];

    const [profileResult, historyResult] = await Promise.all([
      profileIds.length
        ? supabase.from("profiles").select("id, email, display_name").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      linkIds.length
        ? supabase.from("link_usage_history").select("*").in("link_id", linkIds).order("claimed_at", { ascending: false }).limit(30)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profileResult.error || historyResult.error || requestResult.error) {
      setNotice({ type: "danger", message: messageOf(profileResult.error || historyResult.error || requestResult.error) });
      return;
    }

    const profileMap = new Map((profileResult.data || []).map((profile) => [profile.id, profile]));
    setLinks(linkRows);
    setLocks(lockRows.map((lock) => ({ ...lock, profile: profileMap.get(lock.user_id) })));
    setMembers(memberRows.map((member) => ({ ...member, profile: profileMap.get(member.user_id) })));
    setRequests((requestResult.data || []).map((request) => ({ ...request, profile: profileMap.get(request.user_id) })));
    setLinkHistory((historyResult.data || []).map((item) => ({ ...item, profile: profileMap.get(item.user_id) })));
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session?.user) refreshWorkspace(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => refreshWorkspace(nextSession.user), 0);
      } else {
        setGroups([]);
        setSelectedGroup(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshWorkspace]);

  useEffect(() => {
    refreshGroup(selectedGroup);
  }, [selectedGroup, refreshGroup]);

  useEffect(() => {
    if (!user || !selectedGroup) return;
    const channel = supabase
      .channel(`group-live-${selectedGroup.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "link_locks" }, () => refreshGroup(selectedGroup))
      .on("postgres_changes", { event: "*", schema: "public", table: "links", filter: `group_id=eq.${selectedGroup.id}` }, () => refreshGroup(selectedGroup))
      .on("postgres_changes", { event: "*", schema: "public", table: "group_join_requests", filter: `group_id=eq.${selectedGroup.id}` }, () => refreshGroup(selectedGroup))
      .subscribe();
    const intervalId = window.setInterval(() => refreshGroup(selectedGroup), 15000);
    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user, selectedGroup, refreshGroup]);


  useEffect(() => {
    if (!user || !selectedGroup) return;
    const intervalId = window.setInterval(async () => {
      const { data: ownedLocks, error } = await supabase
        .from("link_locks")
        .select("link_id")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString());
      if (!error) {
        for (const lock of ownedLocks || []) {
          await supabase.rpc("renew_link_lock", { p_link_id: lock.link_id });
        }
      }
      await refreshGroup(selectedGroup);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [user, selectedGroup, refreshGroup]);

  const visibleLinks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return links.filter((link) => !keyword || `${link.title} ${link.url}`.toLowerCase().includes(keyword));
  }, [links, search]);

  async function runAction(action, successMessage) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (successMessage) setNotice({ type: "success", message: successMessage });
      await refreshWorkspace(user);
      await refreshGroup(selectedGroup);
      return true;
    } catch (error) {
      setNotice({ type: "danger", message: messageOf(error) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() }, emailRedirectTo: window.location.href },
        });
        if (error) throw error;
        setNotice({ type: "success", message: "Đã tạo tài khoản. Nếu dự án bật xác thực email, hãy xác nhận email trước khi đăng nhập." });
        setAuthMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setNotice({ type: "danger", message: messageOf(error) });
    } finally {
      setBusy(false);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    if (!newGroupName.trim() || newGroupCode.trim().length < 6) return;
    await runAction(async () => {
      const { error } = await supabase.rpc("create_private_group", { p_name: newGroupName.trim(), p_code: newGroupCode.trim() });
      if (error) throw error;
      setNewGroupName("");
      setNewGroupCode("");
    }, "Đã tạo room riêng tư. Gửi mã vào room cho người cần tham gia.");
  }

  async function joinGroup(event) {
    event.preventDefault();
    if (!joinGroupCode.trim()) return;
    await runAction(async () => {
      const { error } = await supabase.rpc("join_private_group", { p_code: joinGroupCode.trim() });
      if (error) throw error;
      setJoinGroupCode("");
    }, "Vào room thành công.");
  }

  async function addLink(event) {
    event.preventDefault();
    if (!selectedGroup || !newLinkTitle.trim() || !newLinkUrl.trim()) return;
    await runAction(async () => {
      const parsed = new URL(newLinkUrl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("URL chỉ được dùng HTTP hoặc HTTPS.");
      const { error } = await supabase.from("links").insert({
        group_id: selectedGroup.id,
        title: newLinkTitle.trim(),
        url: parsed.href,
        created_by: user.id,
      });
      if (error) throw error;
      setNewLinkTitle("");
      setNewLinkUrl("");
    }, "Đã thêm link vào nhóm.");
  }

  async function claimLink(link) {
    const popup = window.open("about:blank", "_blank");
    const claimed = await runAction(async () => {
      const { error } = await supabase.rpc("claim_link", { p_link_id: link.id });
      if (error) throw error;
      if (popup) {
        popup.opener = null;
        popup.location.href = link.url;
      }
    }, popup ? "Đã giữ link trong 30 phút." : "Đã giữ link trong 30 phút. Trình duyệt chặn tab mới; dùng nút mở link ở danh sách.");
    if (!claimed && popup) popup.close();
  }

  async function releaseLink(linkId) {
    await runAction(async () => {
      const { error } = await supabase.rpc("release_link", { p_link_id: linkId });
      if (error) throw error;
    }, "Đã trả link cho nhóm.");
  }

  async function confirmDeleteLink() {
    if (!deleteTarget) return;
    const linkId = deleteTarget.id;
    setDeleteTarget(null);
    await runAction(async () => {
      const { error } = await supabase.from("links").delete().eq("id", linkId);
      if (error) throw error;
    }, "Đã xóa link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setSelectedGroup(null);
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12">
        <h1 className="text-3xl font-semibold">Shared Link Manager</h1>
        <p className="mt-3 text-muted">Cần cấu hình Supabase trước khi sử dụng.</p>
        <Card className="mt-6">
          <Card.Content className="gap-3 p-5">
            <p className="font-medium">Thiết lập biến môi trường</p>
            <p className="text-sm text-muted">Tạo file .env.local từ .env.example và điền Project URL cùng Publishable/Anon key của Supabase.</p>
            <p className="text-sm text-muted">Khi deploy GitHub Pages, khai báo hai biến NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong môi trường build của GitHub Actions.</p>
          </Card.Content>
        </Card>
      </main>
    );
  }

  if (!authReady) {
    return <main className="grid min-h-screen place-items-center text-muted">Đang khởi tạo...</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
        <div className="mb-8">
          <Chip color="accent" size="lg">SL</Chip>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Shared Link Manager</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Quản lý link theo nhóm. Mỗi link chỉ một thành viên được giữ tại một thời điểm.</p>
        </div>
        <Notice notice={notice} />
        <Card>
          <Card.Header className="px-5 pt-5">
            <Card.Title>{authMode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</Card.Title>
            <Card.Description>Dùng email cá nhân để tham gia các nhóm được duyệt.</Card.Description>
          </Card.Header>
          <Card.Content className="p-5">
            <form className="flex flex-col gap-4" onSubmit={handleAuth}>
              {authMode === "signup" && <Field label="Tên hiển thị" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên của mày" required />}
              <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
              <Field label="Mật khẩu" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" required />
              <Button type="submit" fullWidth isDisabled={busy}>{authMode === "signin" ? "Đăng nhập" : "Đăng ký"}</Button>
            </form>
            <Separator className="my-5" />
            <Button variant="tertiary" fullWidth onPress={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>
              {authMode === "signin" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
            </Button>
          </Card.Content>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Chip color="accent" size="lg">SL</Chip>
          <div>
            <p className="font-semibold">Shared Link Manager</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onPress={signOut}><Icon icon="gravity-ui:door-arrow-right" /> Đăng xuất</Button>
      </header>

      <section className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-semibold tracking-[.2em] text-accent">TEAM WORKSPACE</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Quản lý link dùng chung</h1>
        <p className="mt-3 leading-7 text-muted">Một link – một người sử dụng. Trạng thái được đồng bộ giữa các thành viên trong nhóm.</p>
      </section>

      <Notice notice={notice} />

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <Card>
          <Card.Header className="px-5 pt-5">
            <Card.Title>Nhóm của tao</Card.Title>
            <Card.Description>{groups.length} nhóm riêng tư đã tham gia</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-wrap gap-2 p-5 pt-3">
            {groups.map((group) => (
              <Button key={group.id} variant={selectedGroup?.id === group.id ? "primary" : "outline"} onPress={() => setSelectedGroup(group)}>
                {group.name}{group.role === "owner" ? " · Owner" : ""}
              </Button>
            ))}
            {!groups.length && <p className="text-sm text-muted">Chưa tham gia nhóm nào.</p>}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="px-5 pt-5">
            <Card.Title>Tạo nhóm mới</Card.Title>
            <Card.Description>Room riêng tư. Mày tự đặt mã để chia sẻ cho thành viên.</Card.Description>
          </Card.Header>
          <Card.Content className="p-5 pt-3">
            <form className="flex flex-col gap-3" onSubmit={createGroup}>
              <Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Tên room" variant="secondary" fullWidth required />
              <Input type="password" value={newGroupCode} onChange={(event) => setNewGroupCode(event.target.value)} placeholder="Mã vào room (ít nhất 6 ký tự)" variant="secondary" fullWidth minLength={6} required />
              <Button type="submit" isDisabled={busy || !newGroupName.trim() || newGroupCode.trim().length < 6}><Icon icon="gravity-ui:plus" /> Tạo room</Button>
            </form>
          </Card.Content>
        </Card>
      </section>


      <section className="mb-8 max-w-xl">
        <Card>
          <Card.Header className="px-5 pt-5"><Card.Title>Vào room</Card.Title><Card.Description>Nhập mã do Owner cung cấp để tham gia ngay.</Card.Description></Card.Header>
          <Card.Content className="p-5 pt-3">
            <form className="flex gap-2" onSubmit={joinGroup}>
              <Input type="password" value={joinGroupCode} onChange={(event) => setJoinGroupCode(event.target.value)} placeholder="Mã vào room" variant="secondary" fullWidth required />
              <Button type="submit" isDisabled={busy || !joinGroupCode.trim()}>Vào room</Button>
            </form>
          </Card.Content>
        </Card>
      </section>

      {selectedGroup ? (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="min-w-0">
            <Card.Header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Card.Title>{selectedGroup.name}</Card.Title>
                <Card.Description>{links.length} link · {members.length} thành viên</Card.Description>
              </div>
              <Input aria-label="Tìm link" className="w-full sm:max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm link..." variant="secondary" />
            </Card.Header>
            <Separator />
            <Card.Content className="space-y-3 p-5">
              {visibleLinks.map((link) => {
                const lock = locks.find((item) => item.link_id === link.id);
                const mine = lock?.user_id === user.id;
                return (
                  <Card key={link.id} variant="secondary">
                    <Card.Content className="flex flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium">{link.title}</h3>
                          <HeroLink className="mt-1 block break-all text-sm text-accent" href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</HeroLink>
                        </div>
                        <Chip color={lock ? (mine ? "success" : "warning") : "success"} variant="soft" size="sm">
                          {lock ? (mine ? "Mày đang giữ" : "Đang được sử dụng") : "Đang trống"}
                        </Chip>
                      </div>
                      {lock && (
                        <p className="text-xs text-muted">
                          {mine ? "Mày đang giữ link" : `Người giữ: ${lock.profile?.display_name || lock.profile?.email || "Thành viên"}`}
                          {" · "}Hết hạn {new Date(lock.expires_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {!lock && <Button size="sm" onPress={() => claimLink(link)} isDisabled={busy}><Icon icon="gravity-ui:hand" /> Giữ link & mở</Button>}
                        {mine && <Button size="sm" variant="secondary" onPress={() => window.open(link.url, "_blank", "noopener,noreferrer")}><Icon icon="gravity-ui:arrow-up-right-from-square" /> Mở link</Button>}
                        {mine && <Button size="sm" variant="secondary" onPress={() => releaseLink(link.id)} isDisabled={busy}><Icon icon="gravity-ui:unlock" /> Trả link</Button>}
                        {isOwner && <Button size="sm" variant="danger" onPress={() => setDeleteTarget(link)} isDisabled={busy}><Icon icon="gravity-ui:trash-bin" /> Xóa</Button>}
                      </div>
                    </Card.Content>
                  </Card>
                );
              })}
              {!visibleLinks.length && <p className="py-10 text-center text-sm text-muted">{links.length ? "Không tìm thấy link phù hợp." : "Nhóm chưa có link nào."}</p>}
            </Card.Content>
          </Card>

          <div className="space-y-5">
            {isOwner && (
              <>
                <Card>
                  <Card.Header className="px-5 pt-5">
                    <Card.Title>Thêm link</Card.Title>
                    <Card.Description>Chỉ Owner được quản lý danh sách link.</Card.Description>
                  </Card.Header>
                  <Card.Content className="p-5 pt-3">
                    <form className="flex flex-col gap-3" onSubmit={addLink}>
                      <Field label="Tên link" value={newLinkTitle} onChange={(event) => setNewLinkTitle(event.target.value)} placeholder="Production server" required />
                      <Field label="URL" type="url" value={newLinkUrl} onChange={(event) => setNewLinkUrl(event.target.value)} placeholder="https://..." required />
                      <Button type="submit" fullWidth isDisabled={busy}><Icon icon="gravity-ui:plus" /> Thêm link</Button>
                    </form>
                  </Card.Content>
                </Card>

              </>
            )}

            <Card>
              <Card.Header className="px-5 pt-5">
                <Card.Title>Thành viên</Card.Title>
                <Card.Description>{members.length} người trong nhóm</Card.Description>
              </Card.Header>
              <Card.Content className="space-y-3 p-5 pt-3">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{member.profile?.display_name || member.profile?.email || "Thành viên"}</p>
                      <p className="truncate text-xs text-muted">{member.profile?.email}</p>
                    </div>
                    <Chip size="sm" color={member.role === "owner" ? "accent" : "default"}>{member.role === "owner" ? "Owner" : "Member"}</Chip>
                  </div>
                ))}
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="px-5 pt-5">
                <Card.Title>Lịch sử sử dụng</Card.Title>
                <Card.Description>30 lượt gần nhất</Card.Description>
              </Card.Header>
              <Card.Content className="space-y-2 p-5 pt-3">
                {linkHistory.slice(0, 8).map((item) => (
                  <div key={item.id} className="text-xs text-muted">
                    <p>{item.profile?.display_name || item.profile?.email || "Thành viên"}</p>
                    <p>{new Date(item.claimed_at).toLocaleString("vi-VN")}{item.released_at ? ` · Trả lúc ${new Date(item.released_at).toLocaleTimeString("vi-VN")}` : " · Chưa ghi nhận trả"}</p>
                  </div>
                ))}
                {!linkHistory.length && <p className="text-sm text-muted">Chưa có lịch sử.</p>}
              </Card.Content>
            </Card>
          </div>
        </section>
      ) : (
        <Card>
          <Card.Content className="p-8 text-center">
            <p className="font-medium">Chưa có nhóm được chọn</p>
            <p className="mt-2 text-sm text-muted">Tạo room mới hoặc nhập mã để tham gia room riêng tư.</p>
          </Card.Content>
        </Card>
      )}

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={Boolean(deleteTarget)}
          onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}
          variant="blur"
          isDismissable
        >
          <AlertDialog.Container placement="center" size="sm">
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Xóa link?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>Link "{deleteTarget?.title}" sẽ bị xóa khỏi nhóm cùng lịch sử sử dụng.</AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => setDeleteTarget(null)}>Hủy</Button>
                <Button variant="danger" onPress={confirmDeleteLink} isDisabled={busy}>Xóa link</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <footer className="py-10 text-center text-xs text-muted">
        Shared Link Manager · Supabase Auth, PostgreSQL & Realtime · Link lock expires after 30 minutes
      </footer>
    </main>
  );
}
