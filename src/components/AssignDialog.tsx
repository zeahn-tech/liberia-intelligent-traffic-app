import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User } from "lucide-react";
import { Search } from "lucide-react";
import { Shield } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

interface Officer {
  id: string;
  full_name: string;
  badge_number: string;
  station: string;
  role: string;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  currentAssignee?: { id: string; name: string } | null;
  onAssign: (officerId: string, role: string, notes?: string) => Promise<void>;
}

const MOCK_OFFICERS: Officer[] = [
  { id: "ofc-001", full_name: "Ofc. James Tarplah", badge_number: "LNP-8923", station: "Monrovia Central", role: "officer" },
  { id: "ofc-002", full_name: "Sgt. John Kollie", badge_number: "LNP-8741", station: "Monrovia Central", role: "supervisor" },
  { id: "ofc-003", full_name: "Ofc. Patricia Flomo", badge_number: "LNP-9012", station: "Paynesville", role: "officer" },
  { id: "ofc-004", full_name: "Lt. Moses Gbarnga", badge_number: "LNP-7654", station: "Ganta Highway", role: "investigator" },
  { id: "ofc-005", full_name: "Capt. Elizabeth Sumo", badge_number: "LNP-6543", station: "Buchanan", role: "supervisor" },
  { id: "ofc-006", full_name: "Ofc. David Toe", badge_number: "LNP-1122", station: "Monrovia Central", role: "officer" },
];

export function AssignDialog({
  open,
  onOpenChange,
  incidentId,
  currentAssignee,
  onAssign,
}: AssignDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [assignRole, setAssignRole] = useState("investigator");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredOfficers = MOCK_OFFICERS.filter(
    (o) =>
      o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.badge_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.station.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    setSubmitting(true);
    try {
      await onAssign(selectedOfficer.id, assignRole, notes);
      toast.success(`Incident assigned to ${selectedOfficer.full_name}`);
      onOpenChange(false);
      resetForm();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Failed to assign incident");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedOfficer(null);
    setAssignRole("investigator");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {currentAssignee ? "Reassign Incident" : "Assign Incident"}
          </DialogTitle>
          <DialogDescription>
            Assign {incidentId} to an officer for investigation or review
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current assignee */}
          {currentAssignee && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 text-sm">
              <Badge variant="outline" className="clay-pill shrink-0">Currently</Badge>
              <span className="font-medium">{currentAssignee.name}</span>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search officers by name, badge, or station..."
              className="pl-9 clay-inset"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Officer list */}
          <div className="max-h-[240px] overflow-y-auto space-y-1 rounded-xl border border-border/50 p-1">
            {filteredOfficers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No officers found</p>
            ) : (
              filteredOfficers.map((officer) => (
                <button
                  key={officer.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    selectedOfficer?.id === officer.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary/50 border border-transparent"
                  }`}
                  onClick={() => setSelectedOfficer(officer)}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{officer.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{officer.badge_number} · {officer.station}
                    </p>
                  </div>
                  <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4">
                    {officer.role}
                  </Badge>
                  {selectedOfficer?.id === officer.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Assignment Role</Label>
            <Select value={assignRole} onValueChange={setAssignRole}>
              <SelectTrigger className="clay-inset">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investigator">Investigator</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Assignment Notes (optional)</Label>
            <Textarea
              placeholder="Instructions or context for the assignee..."
              className="clay-inset min-h-[60px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="clay-btn rounded-xl"
            onClick={handleAssign}
            disabled={!selectedOfficer || submitting}
          >
            {submitting ? "Assigning..." : currentAssignee ? "Reassign" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
