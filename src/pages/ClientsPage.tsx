import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import EmptyState from "@/components/ui/EmptyState";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import RetentionBadge from "@/components/ui/RetentionBadge";
import { Search, Phone, MessageCircle, Users, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MockClient {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  loyalty: "bronze" | "silver" | "gold" | "vip";
  retention: "new" | "active" | "inactive" | "lost" | "vip";
  avatar?: string;
}

const mockClients: MockClient[] = [
  { id: "1", name: "Anna Karimova", phone: "+998 90 123 4567", totalVisits: 24, totalSpent: 7200000, lastVisit: "3 days ago", loyalty: "vip", retention: "active" },
  { id: "2", name: "Maria Sergeeva", phone: "+998 91 234 5678", totalVisits: 15, totalSpent: 4500000, lastVisit: "1 week ago", loyalty: "gold", retention: "active" },
  { id: "3", name: "Elena Volkova", phone: "+998 93 345 6789", totalVisits: 8, totalSpent: 2400000, lastVisit: "2 weeks ago", loyalty: "silver", retention: "active" },
  { id: "4", name: "Olga Petrova", phone: "+998 94 456 7890", totalVisits: 3, totalSpent: 900000, lastVisit: "1 month ago", loyalty: "bronze", retention: "inactive" },
  { id: "5", name: "Natasha Romanova", phone: "+998 95 567 8901", totalVisits: 1, totalSpent: 300000, lastVisit: "2 months ago", loyalty: "bronze", retention: "lost" },
];

const filters = ["All", "VIP", "Active", "Inactive", "Lost", "New"];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = mockClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesFilter =
      activeFilter === "All" || c.retention === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("uz-UZ").format(val);

  return (
    <div className="min-h-screen">
      <PageHeader title="Clients" subtitle={`${mockClients.length} clients`} />

      <div className="px-4 space-y-3 pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, Telegram..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>

        {/* Filters */}
        <ChipGroup options={filters} selected={activeFilter} onChange={setActiveFilter} />

        {/* Client List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                    {client.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{client.name}</span>
                      <LoyaltyBadge level={client.loyalty} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {client.totalVisits} visits
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(client.totalSpent)} UZS
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <RetentionBadge status={client.retention} />
                      <span className="text-[10px] text-muted-foreground">{client.lastVisit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(client.phone); toast.success("Phone copied"); }}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => toast.info("Add client coming soon")} />
    </div>
  );
}
