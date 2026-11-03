"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
} from "@heroui/react";

const STORAGE_KEY = "meet-manager-items-v1";
const BACKUP_SCHEMA = "meet-manager-backup";

const STATUS = {
  scheduled: { label: "Đã lên lịch", color: "accent" },
  live: { label: "Đang họp", color: "success" },
  ended: { label: "Đã kết thúc", color: "default" },
};

const STATUS_OPTIONS = Object.entries(STATUS).map(([id, item]) => ({
  id,
  label: item.label,
}));

function isValidMeeting(item) {
  if (!item || typeof item !== "object") return false;
  if (typeof item.id !== "string" || typeof item.title !== "string") return false;
  if (typeof item.url !== "string" || !Object.hasOwn(STATUS, item.status)) return false;

  try {
    const parsed = new URL(item.url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function StatusSelect({ value, onChange, label = "Trạng thái" }) {
  return (
    <Select
      aria-label={label}
      className="w-full sm:w-48"
      value={value}
      onChange={(nextValue) => nextValue && onChange(String(nextValue))}
      variant="secondary"
    >
      <Select.Trigger className="min-h-10">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {STATUS_OPTIONS.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export default function HomePage() {
  const [meetings, setMeetings] = useState([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setMeetings(saved.filter(isValidMeeting));
    } catch {
      setNotice({ type: "danger", message: "Không đọc được dữ liệu lưu trên trình duyệt." });
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

  function showNotice(message, type = "default") {
    setNotice({ message, type });
  }

  function addMeeting(event) {
    event.preventDefault();

    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      showNotice("URL không hợp lệ. Hãy kiểm tra lại liên kết.", "danger");
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
    setMeetings((current) => current.map((item) => (
      item.id === id ? { ...item, status: nextStatus } : item
    )));
    showNotice("Đã cập nhật trạng thái.", "success");
  }

  function deleteMeeting(id) {
    if (!window.confirm("Xóa cuộc họp này?")) return;

    setMeetings((current) => current.filter((item) => item.id !== id));
    showNotice("Đã xóa cuộc họp.", "success");
  }

  function exportConfig() {
    const backup = {
      schema: BACKUP_SCHEMA,
      version: 1,
      exportedAt: new Date().toISOString(),
      meetings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
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
      showNotice(error.message || "Không thể đọc file cấu hình.", "danger");
    }
  }

  const count = (key) => meetings.filter((item) => item.status === key).length;

  const stats = [
    { label: "Tổng cuộc họp", value: meetings.length, detail: "Tất cả cuộc họp", color: "accent" },
    { label: "Đang họp", value: count("live"), detail: "Đang diễn ra", color: "success" },
    { label: "Đã lên lịch", value: count("scheduled"), detail: "Chờ bắt đầu", color: "default" },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-7 text-foreground sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-blue-950/40">
            M
          </div>
          <div>
            <p className="font-semibold tracking-wide">Meet Manager</p>
            <p className="text-xs text-muted">Personal meeting workspace</p>
          </div>
        </div>
        <Chip color="accent" variant="soft" size="sm">NEXT.JS · REACT · HEROUI V3</Chip>
      </header>

      <section className="mb-9 max-w-3xl">
        <p className="mb-3 text-xs font-semibold tracking-[.22em] text-accent">WORKSPACE</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Quản lý cuộc họp</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Tập trung các liên kết Google Meet tại một nơi. Sao lưu và khôi phục danh sách bằng file JSON.
        </p>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} variant="secondary" className="min-h-32">
            <Card.Content className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{item.label}</p>
                <Chip color={item.color} variant="soft" size="sm">{item.detail}</Chip>
              </div>
              <p className="text-3xl font-semibold tabular-nums">{item.value}</p>
            </Card.Content>
          </Card>
        ))}
      </section>

      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold">Danh sách cuộc họp</h2>
          <p className="mt-1 text-sm text-muted">Dữ liệu lưu trên trình duyệt hiện tại.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onPress={exportConfig} isDisabled={!ready}>
            <span aria-hidden="true">↓</span>
            Export JSON
          </Button>
          <Button variant="secondary" onPress={() => fileRef.current?.click()}>
            <span aria-hidden="true">↑</span>
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={importConfig}
          />
        </div>
      </div>

      {notice && (
        <Alert status={notice.type} className="mb-5">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{notice.type === "danger" ? "Có lỗi xảy ra" : notice.type === "success" ? "Thành công" : "Thông báo"}</Alert.Title>
            <Alert.Description>{notice.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <section className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="min-w-0">
          <Card.Header className="px-5 pt-5">
            <Card.Title>Thêm cuộc họp</Card.Title>
            <Card.Description>Tạo một liên kết Google Meet mới.</Card.Description>
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            <form onSubmit={addMeeting} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting-title">Tên cuộc họp</Label>
                <Input
                  id="meeting-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ví dụ: Daily meeting"
                  variant="secondary"
                  fullWidth
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting-url">Google Meet URL</Label>
                <Input
                  id="meeting-url"
                  type="url"
                  required
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://meet.google.com/..."
                  variant="secondary"
                  fullWidth
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Trạng thái ban đầu</Label>
                <StatusSelect value={status} onChange={setStatus} label="Trạng thái ban đầu" />
              </div>

              <Button type="submit" variant="primary" fullWidth>
                <span aria-hidden="true">＋</span>
                Thêm cuộc họp
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card className="min-w-0">
          <Card.Header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Card.Title>Cuộc họp của mày</Card.Title>
              <Card.Description>{filtered.length} / {meetings.length} cuộc họp</Card.Description>
            </div>
            <Input
              aria-label="Tìm cuộc họp"
              className="w-full sm:max-w-xs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc URL..."
              variant="secondary"
            />
          </Card.Header>
          <Separator />
          <Card.Content className="px-5 pb-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-default/10 text-2xl" aria-hidden="true">⌕</div>
                <p className="font-medium">{meetings.length ? "Không tìm thấy cuộc họp" : "Chưa có cuộc họp nào"}</p>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  {meetings.length
                    ? "Thử từ khóa khác."
                    : "Thêm cuộc họp đầu tiên hoặc import file JSON để bắt đầu."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-separator bg-surface-secondary/60 p-4 transition-colors hover:bg-surface-secondary"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h3 className="break-words font-medium">{item.title}</h3>
                        <a
                          className="mt-1 block break-all text-sm text-accent hover:underline"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.url}
                        </a>
                      </div>
                      <Chip color={STATUS[item.status].color} variant="soft" size="sm">
                        {STATUS[item.status].label}
                      </Chip>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <StatusSelect
                        value={item.status}
                        onChange={(nextStatus) => updateStatus(item.id, nextStatus)}
                        label={`Trạng thái của ${item.title}`}
                      />
                      <Button size="sm" variant="danger" onPress={() => deleteMeeting(item.id)}>
                        Xóa
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </section>

      <footer className="py-10 text-center text-xs text-muted">
        Meet Manager · Static frontend · Trạng thái cuộc họp được cập nhật thủ công
      </footer>
    </main>
  );
}
