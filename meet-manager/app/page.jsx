"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input } from "@heroui/react";

const STORAGE_KEY = "meet-manager-items-v1";
const BACKUP_SCHEMA = "meet-manager-backup";
const STATUS = {
  scheduled: "Đã lên lịch",
  live: "Đang họp",
  ended: "Đã kết thúc",
};

function isValidMeeting(item) {
  if (!item || typeof item !== "object") return false;
  if (typeof item.id !== "string" || typeof item.title !== "string") return false;
  if (typeof item.url !== "string" || !["scheduled", "live", "ended"].includes(item.status)) return false;
  try {
    const parsed = new URL(item.url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function HomePage() {
  const [meetings, setMeetings] = useState([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setMeetings(saved.filter(isValidMeeting));
    } catch {
      setNotice("Không đọc được dữ liệu lưu trên trình duyệt.");
      setNoticeType("error");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  }, [meetings, ready]);

  const filtered = useMemo(
    () => meetings.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(query.toLowerCase())),
    [meetings, query],
  );

  const showNotice = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  };

  function addMeeting(event) {
    event.preventDefault();
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      showNotice("URL không hợp lệ. Hãy kiểm tra lại liên kết.", "error");
      return;
    }

    setMeetings((current) => [{
      id: crypto.randomUUID(),
      title: title.trim() || "Cuộc họp mới",
      url: url.trim(),
      status,
      createdAt: new Date().toISOString(),
    }, ...current]);
    setTitle("");
    setUrl("");
    setStatus("scheduled");
    showNotice("Đã thêm cuộc họp.", "success");
  }

  function updateStatus(id, nextStatus) {
    setMeetings((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
  }

  function deleteMeeting(id) {
    if (window.confirm("Xóa cuộc họp này?")) {
      setMeetings((current) => current.filter((item) => item.id !== id));
      showNotice("Đã xóa cuộc họp.");
    }
  }

  function exportConfig() {
    const backup = {
      schema: BACKUP_SCHEMA,
      version: 1,
      exportedAt: new Date().toISOString(),
      meetings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `meet-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
    showNotice(`Đã export ${meetings.length} cuộc họp ra file JSON.`, "success");
  }

  async function importConfig(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const imported = Array.isArray(parsed)
        ? parsed
        : parsed?.schema === BACKUP_SCHEMA && parsed?.version === 1
          ? parsed.meetings
          : null;

      if (!Array.isArray(imported) || !imported.every(isValidMeeting)) {
        throw new Error("File không đúng định dạng Meet Manager hoặc chứa dữ liệu không hợp lệ.");
      }

      if (!window.confirm(`Import ${imported.length} cuộc họp và thay thế toàn bộ danh sách hiện tại?`)) return;

      const ids = new Set();
      const normalized = imported.map((item) => {
        let id = item.id;
        if (ids.has(id)) id = crypto.randomUUID();
        ids.add(id);
        return { ...item, id };
      });
      setMeetings(normalized);
      showNotice(`Import thành công ${normalized.length} cuộc họp.`, "success");
    } catch (error) {
      showNotice(error.message || "Không thể đọc file cấu hình.", "error");
    }
  }

  const count = (key) => meetings.filter((item) => item.status === key).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold shadow-lg shadow-blue-950/40">M</div>
          <div>
            <div className="font-semibold tracking-wide">Meet Manager</div>
            <div className="text-xs text-default-500">Personal meeting workspace</div>
          </div>
        </div>
        <div className="rounded-full border border-default-200/20 bg-default-100/5 px-3 py-1.5 text-xs text-default-400">NEXT.JS · REACT · HEROUI V3</div>
      </header>

      <section className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-semibold tracking-[.22em] text-blue-400">WORKSPACE</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Quản lý cuộc họp</h1>
        <p className="mt-4 max-w-2xl leading-7 text-default-400">Tập trung các liên kết Google Meet tại một nơi. Sao lưu và khôi phục danh sách bằng file JSON.</p>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Tổng cuộc họp", meetings.length],
          ["Đang họp", count("live")],
          ["Đã lên lịch", count("scheduled")],
        ].map(([label, value]) => (
          <Card key={label} className="meet-panel">
            <Card.Content className="p-5">
              <p className="text-sm text-default-400">{label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            </Card.Content>
          </Card>
        ))}
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Danh sách cuộc họp</h2>
          <p className="mt-1 text-sm text-default-500">Dữ liệu lưu trên trình duyệt hiện tại.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onPress={exportConfig} isDisabled={!ready}>Export JSON</Button>
          <Button variant="secondary" onPress={() => fileRef.current?.click()}>Import JSON</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={importConfig} />
        </div>
      </div>

      {notice && (
        <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${noticeType === "error" ? "border-danger/30 bg-danger/10 text-danger" : noticeType === "success" ? "border-success/30 bg-success/10 text-success" : "border-default-200/20 bg-default-100/5 text-default-300"}`}>
          {notice}
        </div>
      )}

      <section className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="meet-panel">
          <Card.Header className="px-5 pt-5">
            <Card.Title>Thêm cuộc họp</Card.Title>
            <Card.Description>Tạo một liên kết Google Meet mới.</Card.Description>
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            <form onSubmit={addMeeting} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-default-400">Tên cuộc họp</span>
                <Input aria-label="Tên cuộc họp" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Daily meeting" variant="secondary" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-default-400">Google Meet URL</span>
                <Input aria-label="Google Meet URL" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://meet.google.com/..." variant="secondary" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-default-400">Trạng thái ban đầu</span>
                <select className="meet-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                  {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <Button type="submit" variant="primary" fullWidth>+ Thêm cuộc họp</Button>
            </form>
          </Card.Content>
        </Card>

        <Card className="meet-panel min-w-0">
          <Card.Header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Card.Title>Cuộc họp của mày</Card.Title>
              <Card.Description>{filtered.length} / {meetings.length} cuộc họp</Card.Description>
            </div>
            <Input aria-label="Tìm cuộc họp" className="w-full sm:max-w-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc URL..." variant="secondary" />
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-default-300/20 px-5 py-12 text-center">
                <p className="font-medium">{meetings.length ? "Không tìm thấy cuộc họp" : "Chưa có cuộc họp nào"}</p>
                <p className="mt-2 text-sm text-default-500">{meetings.length ? "Thử từ khóa khác." : "Thêm cuộc họp đầu tiên hoặc import file JSON."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-default-200/15 bg-black/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-medium">{item.title}</h3>
                        <a className="mt-1 block break-all text-sm text-blue-400 hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                      </div>
                      <span className="rounded-full bg-default-100/10 px-3 py-1 text-xs text-default-300">{STATUS[item.status]}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <select aria-label="Cập nhật trạng thái" className="meet-select max-w-44 text-sm" value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)}>
                        {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                      <Button size="sm" variant="danger-soft" onPress={() => deleteMeeting(item.id)}>Xóa</Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </section>

      <footer className="py-10 text-center text-xs text-default-600">Meet Manager · Static frontend · Trạng thái cuộc họp được cập nhật thủ công</footer>
    </main>
  );
}
