import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Pencil, X, Phone, Instagram, Send, User as UserIcon, Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMasterProfile, useUpsertMasterProfile, useUploadMasterAvatar } from "@/hooks/useMasterProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function MasterProfileCard() {
  const { user } = useAuth();
  const { data: profile } = useMasterProfile();
  const upsert = useUpsertMasterProfile();
  const uploadAvatar = useUploadMasterAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "", instagram: "", telegram: "" });

  useEffect(() => {
    if (profile && open) {
      setForm({
        display_name: profile.display_name ?? "",
        phone: profile.phone ?? "",
        instagram: profile.instagram ?? "",
        telegram: profile.telegram ?? "",
      });
    }
  }, [open, profile]);

  const openEdit = () => {
    setForm({
      display_name: profile?.display_name ?? "",
      phone: profile?.phone ?? "",
      instagram: profile?.instagram ?? "",
      telegram: profile?.telegram ?? "",
    });
    setOpen(true);
  };

  const submit = async () => {
    await upsert.mutateAsync({
      display_name: form.display_name.trim() || null,
      phone: form.phone.trim() || null,
      instagram: form.instagram.trim().replace(/^@/, "") || null,
      telegram: form.telegram.trim().replace(/^@/, "") || null,
    });
    setOpen(false);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл больше 5MB"); return; }
    uploadAvatar.mutate(file);
    e.target.value = "";
  };

  const name = profile?.display_name || "Ваше имя";
  const initials = (profile?.display_name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <GlassCard elevated className="py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-display font-semibold text-primary">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center">
              {uploadAvatar.isPending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {profile?.phone && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/70 rounded-full px-2 py-0.5">
                  <Phone className="w-2.5 h-2.5" /> {profile.phone}
                </span>
              )}
              {profile?.instagram && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/70 rounded-full px-2 py-0.5">
                  <Instagram className="w-2.5 h-2.5" /> @{profile.instagram}
                </span>
              )}
              {profile?.telegram && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/70 rounded-full px-2 py-0.5">
                  <Send className="w-2.5 h-2.5" /> @{profile.telegram}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={openEdit}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center active:scale-90 shrink-0"
          >
            <Pencil className="w-4 h-4 text-primary" />
          </button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Карточка мастера</h2>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Field icon={<UserIcon className="w-4 h-4" />} placeholder="Имя" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
                <Field icon={<Phone className="w-4 h-4" />} placeholder="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
                <Field icon={<Instagram className="w-4 h-4" />} placeholder="Instagram (без @)" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
                <Field icon={<Send className="w-4 h-4" />} placeholder="Telegram (без @)" value={form.telegram} onChange={(v) => setForm({ ...form, telegram: v })} />
                <motion.button
                  whileTap={{ scale: 0.97 }} onClick={submit} disabled={upsert.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {upsert.isPending ? "Сохранение..." : "Сохранить"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ icon, value, onChange, placeholder, type }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-11 pr-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
