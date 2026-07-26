import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  UserPlus,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  CheckCircle2,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: string;
  full_name: string;
  role: "driver" | "passenger" | "pedestrian" | "owner" | "other";
  id_type: string;
  id_number: string;
  phone: string;
  email: string;
  address: string;
  statement: string;
}

interface Witness {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  statement: string;
  consent_given: boolean;
}

interface InvolvedPersonsProps {
  incidentId: string;
}

export function InvolvedPersons({ incidentId }: InvolvedPersonsProps) {
  const [persons, setPersons] = useState<Person[]>([
    {
      id: "p-1",
      full_name: "James Mulbah",
      role: "driver",
      id_type: "drivers_license",
      id_number: "DL-4521-2024",
      phone: "+231 555 0123",
      email: "",
      address: "Monrovia, Sinkor",
      statement: "Acknowledged exceeding speed limit. Cited medical emergency.",
    },
  ]);

  const [witnesses, setWitnesses] = useState<Witness[]>([
    {
      id: "w-1",
      full_name: "Sarah Johnson",
      phone: "+231 555 9876",
      email: "sarah.j@example.com",
      statement: "Observed the vehicle speeding and weaving through traffic.",
      consent_given: true,
    },
  ]);

  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [showWitnessDialog, setShowWitnessDialog] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingWitness, setEditingWitness] = useState<Witness | null>(null);

  // Person form state
  const [personForm, setPersonForm] = useState({
    full_name: "",
    role: "driver" as Person["role"],
    id_type: "drivers_license",
    id_number: "",
    phone: "",
    email: "",
    address: "",
    statement: "",
  });

  // Witness form state
  const [witnessForm, setWitnessForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    statement: "",
    consent_given: false,
  });

  const resetPersonForm = () => {
    setPersonForm({
      full_name: "", role: "driver", id_type: "drivers_license",
      id_number: "", phone: "", email: "", address: "", statement: "",
    });
    setEditingPerson(null);
  };

  const resetWitnessForm = () => {
    setWitnessForm({
      full_name: "", phone: "", email: "", statement: "", consent_given: false,
    });
    setEditingWitness(null);
  };

  const handleAddPerson = () => {
    const newPerson: Person = {
      id: `p-${Date.now()}`,
      ...personForm,
    };
    if (editingPerson) {
      setPersons(persons.map(p => p.id === editingPerson.id ? { ...newPerson, id: p.id } : p));
      toast.success("Person updated");
    } else {
      setPersons([...persons, newPerson]);
      toast.success("Person added");
    }
    setShowPersonDialog(false);
    resetPersonForm();
  };

  const handleAddWitness = () => {
    const newWitness: Witness = {
      id: `w-${Date.now()}`,
      ...witnessForm,
    };
    if (editingWitness) {
      setWitnesses(witnesses.map(w => w.id === editingWitness.id ? { ...newWitness, id: w.id } : w));
      toast.success("Witness updated");
    } else {
      setWitnesses([...witnesses, newWitness]);
      toast.success("Witness added");
    }
    setShowWitnessDialog(false);
    resetWitnessForm();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "driver": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "passenger": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "pedestrian": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "owner": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Involved Persons */}
      <Card className="clay-card border-border/50 !rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Involved Persons</CardTitle>
            <CardDescription>Drivers, passengers, pedestrians, and vehicle owners</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => { resetPersonForm(); setShowPersonDialog(true); }}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add Person
          </Button>
        </CardHeader>
        <CardContent>
          {persons.length === 0 ? (
            <div className="text-center py-6">
              <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No persons recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {persons.map((person) => (
                <div key={person.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{person.full_name}</p>
                      <Badge className={`clay-pill text-[10px] px-1.5 py-0 h-4 ${getRoleColor(person.role)}`}>
                        {person.role}
                      </Badge>
                    </div>
                    {person.id_number && (
                      <p className="text-xs text-muted-foreground">
                        {person.id_type.replace("_", " ")}: {person.id_number}
                      </p>
                    )}
                    {person.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {person.phone}
                      </p>
                    )}
                    {person.statement && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">
                        "{person.statement}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8"
                      onClick={() => {
                        setEditingPerson(person);
                        setPersonForm({
                          full_name: person.full_name,
                          role: person.role,
                          id_type: person.id_type,
                          id_number: person.id_number,
                          phone: person.phone,
                          email: person.email,
                          address: person.address,
                          statement: person.statement,
                        });
                        setShowPersonDialog(true);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setPersons(persons.filter(p => p.id !== person.id));
                        toast.success("Person removed");
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Witnesses */}
      <Card className="clay-card border-border/50 !rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Witnesses</CardTitle>
            <CardDescription>Third-party witnesses to the incident</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => { resetWitnessForm(); setShowWitnessDialog(true); }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Add Witness
          </Button>
        </CardHeader>
        <CardContent>
          {witnesses.length === 0 ? (
            <div className="text-center py-6">
              <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No witnesses recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {witnesses.map((witness) => (
                <div key={witness.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{witness.full_name}</p>
                      {witness.consent_given && (
                        <Badge variant="outline" className="clay-pill text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          Consent
                        </Badge>
                      )}
                    </div>
                    {witness.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {witness.phone}
                      </p>
                    )}
                    {witness.statement && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">
                        "{witness.statement}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8"
                      onClick={() => {
                        setEditingWitness(witness);
                        setWitnessForm({
                          full_name: witness.full_name,
                          phone: witness.phone,
                          email: witness.email,
                          statement: witness.statement,
                          consent_given: witness.consent_given,
                        });
                        setShowWitnessDialog(true);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setWitnesses(witnesses.filter(w => w.id !== witness.id));
                        toast.success("Witness removed");
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Person Dialog */}
      <Dialog open={showPersonDialog} onOpenChange={setShowPersonDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingPerson ? "Edit Person" : "Add Involved Person"}</DialogTitle>
            <DialogDescription>Record details of a person involved in the incident</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                className="clay-inset"
                value={personForm.full_name}
                onChange={(e) => setPersonForm({ ...personForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={personForm.role} onValueChange={(v) => setPersonForm({ ...personForm, role: v as Person["role"] })}>
                  <SelectTrigger className="clay-inset"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="pedestrian">Pedestrian</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={personForm.id_type} onValueChange={(v) => setPersonForm({ ...personForm, id_type: v })}>
                  <SelectTrigger className="clay-inset"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input className="clay-inset" value={personForm.id_number}
                  onChange={(e) => setPersonForm({ ...personForm, id_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input className="clay-inset" value={personForm.phone}
                  onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input className="clay-inset" value={personForm.address}
                onChange={(e) => setPersonForm({ ...personForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Statement</Label>
              <Textarea className="clay-inset min-h-[60px] resize-none" value={personForm.statement}
                onChange={(e) => setPersonForm({ ...personForm, statement: e.target.value })}
                placeholder="Person's statement or notes..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowPersonDialog(false)}>Cancel</Button>
            <Button className="clay-btn rounded-xl" onClick={handleAddPerson}
              disabled={!personForm.full_name}>
              {editingPerson ? "Update" : "Add Person"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Witness Dialog */}
      <Dialog open={showWitnessDialog} onOpenChange={setShowWitnessDialog}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingWitness ? "Edit Witness" : "Add Witness"}</DialogTitle>
            <DialogDescription>Record a witness to the incident</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input className="clay-inset" value={witnessForm.full_name}
                onChange={(e) => setWitnessForm({ ...witnessForm, full_name: e.target.value })}
                placeholder="Enter witness name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input className="clay-inset" value={witnessForm.phone}
                  onChange={(e) => setWitnessForm({ ...witnessForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input className="clay-inset" type="email" value={witnessForm.email}
                  onChange={(e) => setWitnessForm({ ...witnessForm, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statement</Label>
              <Textarea className="clay-inset min-h-[80px] resize-none" value={witnessForm.statement}
                onChange={(e) => setWitnessForm({ ...witnessForm, statement: e.target.value })}
                placeholder="Witness statement..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={witnessForm.consent_given}
                onChange={(e) => setWitnessForm({ ...witnessForm, consent_given: e.target.checked })}
              />
              <span className="text-sm">Witness has consented to provide statement</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowWitnessDialog(false)}>Cancel</Button>
            <Button className="clay-btn rounded-xl" onClick={handleAddWitness}
              disabled={!witnessForm.full_name}>
              {editingWitness ? "Update" : "Add Witness"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
