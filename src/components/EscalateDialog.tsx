import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

interface EscalateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  onEscalate: (level: string, reason: string, notes: string) => Promise<void>;
}

export function EscalateDialog({
  open,
  onOpenChange,
  incidentId,
  onEscalate,
}: EscalateDialogProps) {
  const [escalationLevel, setEscalationLevel] = useState("supervisor");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEscalate = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onEscalate(escalationLevel, reason, notes);
      toast.success(`Incident escalated to ${escalationLevel}`);
      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to escalate incident");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEscalationLevel("supervisor");
    setReason("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-warning" />
            Escalate Incident
          </DialogTitle>
          <DialogDescription>
            Escalate {incidentId} to a higher authority for review or intervention
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Escalation should be used when you need supervisory intervention,
              additional resources, or the incident requires higher authority.
            </p>
          </div>

          {/* Escalation level */}
          <div className="space-y-2">
            <Label>Escalate To</Label>
            <Select value={escalationLevel} onValueChange={setEscalationLevel}>
              <SelectTrigger className="clay-inset">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="commander">Commander / Division Head</SelectItem>
                <SelectItem value="internal_affairs">Internal Affairs</SelectItem>
                <SelectItem value="judicial">Judicial / Prosecutor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Escalation</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="clay-inset">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requires_approval">Requires Higher Approval</SelectItem>
                <SelectItem value="complex_case">Complex / Multi-jurisdiction Case</SelectItem>
                <SelectItem value="resource_needed">Additional Resources Needed</SelectItem>
                <SelectItem value="conflict_of_interest">Conflict of Interest</SelectItem>
                <SelectItem value="policy_question">Policy / Legal Question</SelectItem>
                <SelectItem value="public_interest">High Public Interest / Media</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Escalation Notes</Label>
            <Textarea
              placeholder="Provide context for why this is being escalated..."
              className="clay-inset min-h-[80px] resize-none"
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
            onClick={handleEscalate}
            disabled={!reason || submitting}
          >
            {submitting ? "Escalating..." : "Escalate Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
