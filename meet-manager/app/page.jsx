"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Alert, AlertDialog, Button, Card, Chip, Input, Link as HeroLink, Separator } from "@heroui/react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const ERROR_TEXT = {
  "This link is already in use": "Link đang được thành viên khác sử dụng.",
  "You are already a member": "Mày đã là thành viên của nhóm này.",
  "Request not found or permission denied": "Không tìm thấy yêu cầu hoặc mày không có quyền duyệt.",
  "Invalid room code": "Mã vào room không đúng.",
  "This join code is already used. Choose another one": "Mã này đã được sử dụng. Hãy chọn mã khác.",
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


function UsageLineChart({ history }) {
  const points = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    return days.map((date) => {
      const key = date.toLocaleDateString("en-CA");
      const count = history.filter((item) => new Date(item.claimed_at).toLocaleDateString("en-CA") === key).length;
      return { label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), count };
    });
  }, [history]);
  const max = Math.max(4, ...points.map((point) => point.count));
  const coords = points.map((point, index) => ({ x: 28 + (index * 544) / 6, y: 166 - (point.count / max) * 132, ...point }));
  const line = coords.map((point) => point.x + "," + point.y).join(" ");
  const total = points.reduce((sum, point) => sum + point.count, 0);
  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between px-5 pt-5">
        <div><Card.Title>Lượt sử dụng link</Card.Title><Card.Description>7 ngày gần nhất</Card.Description></div>
        <div className="text-right"><p className="text-2xl font-semibold tabular-nums">{total}</p><p className="text-xs text-muted">lượt sử dụng</p></div>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-2">
        <svg viewBox="0 0 600 210" role="img" aria-label="Biểu đồ lượt sử dụng link trong 7 ngày gần nhất" className="h-auto w-full overflow-visible">
          {[0, 1, 2, 3].map((step) => {
            const y = 166 - step * 44;
            return <g key={step}><line x1="28" y1={y} x2="572" y2={y} stroke="currentColor" opacity=".12" strokeDasharray="4 5" /><text x="18" y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{Math.round((max * step) / 3)}</text></g>;
          })}
          <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="4.5" fill="var(--accent)" stroke="var(--background)" strokeWidth="2" /><text x={point.x} y="190" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{point.label}</text>{point.count > 0 && <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">{point.count}</text>}</g>)}
        </svg>
      </Card.Content>
    </Card>
  );
}

function ActivityTimeline({ history }) {
  const events = history.flatMap((item) => [
    { id: item.id + "-claimed", at: item.claimed_at, type: "claimed", item },
    ...(item.released_at ? [{ id: item.id + "-released", at: item.released_at, type: "released", item }] : []),
  ]).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 20);
  return (
    <Card>
      <Card.Header className="px-5 pt-5"><Card.Title>Timeline hoạt động</Card.Title><Card.Description>20 sự kiện gần nhất của các thành viên</Card.Description></Card.Header>
      <Card.Content className="p-5 pt-2">
        {events.length ? <ol className="relative ml-2 space-y-5 border-l border-default pl-5">
          {events.map((event) => <li key={event.id} className="relative">
            <span className={"absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-background " + (event.type === "claimed" ? "bg-accent" : "bg-success")} />
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="text-sm"><span className="font-medium">{event.item.profile?.display_name || event.item.profile?.email || "Thành viên"}</span>{event.type === "claimed" ? " đã giữ link " : " đã trả link "}<span className="font-medium">{event.item.link_title || "Link đã xóa"}</span></p>
              <time className="shrink-0 text-xs text-muted">{new Date(event.at).toLocaleString("vi-VN")}</time>
            </div>
          </li>)}
        </ol> : <p className="py-6 text-center text-sm text-muted">Chưa có hoạt động nào được ghi nhận.</p>}
      </Card.Content>
    </Card>
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
  const [joinGroupCode, setJoinGroupCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isRoomPage, setIsRoomPage] = useState(false);
  const [requestedRoomId, setRequestedRoomId] = useState(null);
  const inviteHandled = useRef(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
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
        ? supabase.from("link_usage_history").select("*").in("link_id", linkIds).order("claimed_at", { ascending: false }).limit(200)
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
    setLinkHistory((historyResult.data || []).map((item) => ({ ...item, profile: profileMap.get(item.user_id), link_title: linkRows.find((link) => link.id === item.link_id)?.title || "Link đã xóa" })));
  }, [user]);

  useEffect(() => {
    const isDetail = window.location.pathname.endsWith("/room/") || window.location.pathname.endsWith("/room");
    const params = new URLSearchParams(window.location.search);
    setIsRoomPage(isDetail);
    setRequestedRoomId(params.get("id"));
  }, []);

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
    if (!user || inviteHandled.current) return;
    const inviteCodeFromUrl = new URLSearchParams(window.location.search).get("join");
    if (!inviteCodeFromUrl) return;

    inviteHandled.current = true;
    window.history.replaceState({}, "", window.location.pathname);

    (async () => {
      setBusy(true);
      setNotice(null);
      try {
        const { error } = await supabase.rpc("join_private_group", { p_code: inviteCodeFromUrl });
        if (error) throw error;
        setNotice({ type: "success", message: "Đã tham gia room từ link mời." });
        await refreshWorkspace(user);
      } catch (error) {
        setNotice({ type: "danger", message: messageOf(error) });
      } finally {
        setBusy(false);
      }
    })();
  }, [user, refreshWorkspace]);

  useEffect(() => {
    if (!isRoomPage || !requestedRoomId || !groups.length) return;
    const room = groups.find((item) => item.id === requestedRoomId);
    if (room) setSelectedGroup(room);
    else setNotice({ type: "danger", message: "Room không tồn tại hoặc tài khoản chưa tham gia room này." });
  }, [isRoomPage, requestedRoomId, groups]);

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
  async function copyInviteLink() {
    const code = inviteCode.trim();
    if (!selectedGroup || code.length < 6) return;
    const inviteUrl = new URL("/meet-manager/room/", window.location.origin);
    inviteUrl.searchParams.set("id", selectedGroup.id);
    inviteUrl.searchParams.set("join", code);
    try {
      await navigator.clipboard.writeText(inviteUrl.toString());
      setNotice({ type: "success", message: "Đã copy link mời. Ai có link này đều có thể tham gia room." });
    } catch {
      setNotice({ type: "danger", message: "Không thể tự động copy. Hãy kiểm tra quyền clipboard của trình duyệt." });
    }
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
            <Card.Description>Đăng nhập để quản lý room và sử dụng link dùng chung.</Card.Description>
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
        <div className="flex items-center gap-2">
          {isRoomPage && <Button variant="outline" onPress={() => window.location.assign("/meet-manager/")}><Icon icon="gravity-ui:arrow-left" /> Trang chủ</Button>}
          <Button variant="outline" onPress={signOut}><Icon icon="gravity-ui:door-arrow-right" /> Đăng xuất</Button>
        </div>
      </header>

      <section className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-semibold tracking-[.2em] text-accent">TEAM WORKSPACE</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Quản lý link dùng chung</h1>
        <p className="mt-3 leading-7 text-muted">Một link – một người sử dụng. Trạng thái được đồng bộ giữa các thành viên trong nhóm.</p>
      </section>

      <Notice notice={notice} />

{!isRoomPage && (
      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <Card>
          <Card.Header className="px-5 pt-5">
            <Card.Title>Room của tao</Card.Title>
            <Card.Description>{groups.length} room riêng tư đã tham gia</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-wrap gap-2 p-5 pt-3">
            {groups.map((group) => (
              <Button key={group.id} variant="outline" onPress={() => window.location.assign(`/meet-manager/room/?id=${encodeURIComponent(group.id)}`)}>
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


)}

{!isRoomPage && (
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

)}

      {isRoomPage && selectedGroup ? (
        <>
        <section className="space-y-5">
          <UsageLineChart history={linkHistory} />
          <ActivityTimeline history={linkHistory} />
        </section>
        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                <Card.Title>Chia sẻ room</Card.Title>
                <Card.Description>Copy URL hiện tại để mở lại đúng room này. Muốn mời người mới, nhập mã room để tạo link tham gia.</Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3 p-5 pt-3">
                <Button variant="outline" fullWidth onPress={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setNotice({ type: "success", message: "Đã copy link trang room." });
                  } catch {
                    setNotice({ type: "danger", message: "Trình duyệt không cho phép truy cập clipboard." });
                  }
                }}>
                  <Icon icon="gravity-ui:copy" /> Copy link hiện tại
                </Button>
                <Separator />
                <Input
                  type="password"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="Mã vào room (ít nhất 6 ký tự)"
                  variant="secondary"
                  fullWidth
                />
                <Button fullWidth onPress={copyInviteLink} isDisabled={busy || inviteCode.trim().length < 6}>
                  <Icon icon="gravity-ui:link" /> Copy link mời thành viên
                </Button>
                <p className="text-xs text-muted">Link mời cho phép người nhận tham gia room sau khi đăng nhập.</p>
              </Card.Content>
            </Card>

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
        </>
      ) : isRoomPage ? (
        <Card>
          <Card.Content className="p-8 text-center">
            <p className="font-medium">Không tìm thấy room</p>
            <p className="mt-2 text-sm text-muted">Quay lại trang chủ để chọn room hoặc tham gia bằng mã.</p>
            <Button className="mt-4" onPress={() => window.location.assign("/meet-manager/")}>Về trang chủ</Button>
          </Card.Content>
        </Card>
      ) : null}

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
