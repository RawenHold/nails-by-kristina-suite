import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import RetentionBadge from "@/components/ui/RetentionBadge";
import ChipGroup from "@/components/ui/ChipGroup";
import { motion } from "framer-motion";
import {
  Phone, MessageCircle, CalendarDays, Bell, Heart,
  Clock, DollarSign, Palette, Sparkles, Star,
  ChevronRight, Copy, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const mockClient = {
  id: "1",
  name: "Anna Karimova",
  phone: "+998 90 123 4567",
  telegram: "@anna_k",
  loyalty: "vip" as const,
  retention: "active" as const,
  totalVisits: 24,
  totalSpent: 7200000,
  avgCheck: 300000,
  lastVisit: "3 days ago",
  daysSinceLastVisit: 3,
  nextVisit: "Apr 22, 2026",
  favoriteColors: ["Nude", "Pink", "White"],
  favoriteShape: "Almond",
  favoriteLength: "Medium",
  favoriteDesigns: ["French", "Minimalist", "Geometric"],
  notes: "Prefers quiet appointments, loves pastel tones. Allergic to certain gel brands.",
  allergies: "Sensitive to DG gel brand",
};

const visitHistory = [
  { date: "Apr 12, 2026", services: ["Gel Polish", "Design"], price: 350000, colors: ["Nude", "Gold"], shape: "Almond", photos: 3 },
  { date: "Mar 28, 2026", services: ["Manicure", "Gel Polish"], price: 280000, colors: ["Pink", "White"], shape: "Almond", photos: 2 },
  { date: "Mar 14, 2026", services: ["Removal", "New Set", "Design"], price: 450000, colors: ["Burgundy"], shape: "Almond", photos: 4 },
  { date: "Feb 28, 2026", services: ["Gel Polish"], price: 250000, colors: ["Nude"], shape: "Almond", photos: 1 },
];

const tabs = ["Overview", "Timeline", "Gallery"];

export default function ClientProfilePage() {
  const [tab, setTab] = useState("Overview");
  const navigate = useNavigate();
  const c = mockClient;
  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  return (
    <div className="min-h-screen">
      <PageHeader title={c.name} showBack />

      <div className="px-4 space-y-4 pb-6">
        {/* Hero Card */}
        <GlassCard elevated className="text-center pt-6 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-primary">{c.name.split(" ").map(n => n[0]).join("")}</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{c.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <LoyaltyBadge level={c.loyalty} />
            <RetentionBadge status={c.retention} />
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-3 mt-4">
            {[
              { icon: Phone, label: "Call", action: () => { navigator.clipboard.writeText(c.phone); toast.success("Phone copied"); } },
              { icon: MessageCircle, label: "Telegram", action: () => toast.info("Opening Telegram...") },
              { icon: CalendarDays, label: "Book", action: () => navigate("/calendar") },
              { icon: Bell, label: "Remind", action: () => toast.info("Reminder creation coming soon") },
            ].map(a => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <div className="w-10 h-10 rounded-2xl bg-secondary/70 flex items-center justify-center">
                  <a.icon className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Visits", value: c.totalVisits.toString() },
            { label: "Spent", value: `${(c.totalSpent / 1000000).toFixed(1)}M` },
            { label: "Avg", value: `${(c.avgCheck / 1000).toFixed(0)}K` },
            { label: "Days", value: c.daysSinceLastVisit.toString() },
          ].map(s => (
            <GlassCard key={s.label} className="text-center py-3 px-2">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Next Visit Alert */}
        <GlassCard className="flex items-center gap-3 py-3 border-l-[3px] border-l-primary">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Next visit recommended</p>
            <p className="text-[11px] text-muted-foreground">{c.nextVisit}</p>
          </div>
          <button onClick={() => toast.info("Quick booking coming soon")} className="text-[11px] font-semibold text-primary active:opacity-70">
            Book
          </button>
        </GlassCard>

        {/* Tabs */}
        <ChipGroup options={tabs} selected={tab} onChange={setTab} />

        {tab === "Overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Preferences */}
            <GlassCard>
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Preferences
              </p>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Favorite Colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.favoriteColors.map(color => (
                      <span key={color} className="text-[11px] font-medium bg-primary/8 text-primary px-2.5 py-1 rounded-full">{color}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Shape</p>
                    <p className="text-sm font-medium text-foreground">{c.favoriteShape}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Length</p>
                    <p className="text-sm font-medium text-foreground">{c.favoriteLength}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Designs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.favoriteDesigns.map(d => (
                      <span key={d} className="text-[11px] font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Notes & Allergies */}
            {(c.notes || c.allergies) && (
              <GlassCard>
                {c.allergies && (
                  <div className="flex items-start gap-2 mb-2 p-2 rounded-xl bg-destructive/5">
                    <span className="text-[10px] font-bold text-destructive">⚠️</span>
                    <p className="text-xs text-destructive">{c.allergies}</p>
                  </div>
                )}
                {c.notes && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.notes}</p>
                )}
              </GlassCard>
            )}

            {/* Contact Info */}
            <GlassCard>
              <p className="text-xs font-semibold text-foreground mb-2">Contact</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                  <button onClick={() => { navigator.clipboard.writeText(c.phone); toast.success("Copied"); }} className="active:scale-90 transition-transform">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.telegram}</span>
                  <button onClick={() => { navigator.clipboard.writeText(c.telegram); toast.success("Copied"); }} className="active:scale-90 transition-transform">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === "Timeline" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {visitHistory.map((visit, i) => (
              <GlassCard key={i} className="py-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{visit.date}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {visit.services.map(s => (
                        <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground">{formatCurrency(visit.price)}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> {visit.colors.join(", ")}</span>
                  <span>• {visit.shape}</span>
                  {visit.photos > 0 && <span>• {visit.photos} photos</span>}
                </div>
                <button className="flex items-center gap-1 mt-2 text-[11px] font-medium text-primary active:opacity-70">
                  Repeat this visit <ArrowRight className="w-3 h-3" />
                </button>
              </GlassCard>
            ))}
          </motion.div>
        )}

        {tab === "Gallery" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-3 gap-1.5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-secondary/50 shimmer" />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
