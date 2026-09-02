import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ExternalLink, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import type { NewResourceInput } from "@/hooks/use-resources";
import {
  GRADE_LEVELS,
  LEARNING_AREAS,
  POSITIONS,
  QUARTERS,
  RESOURCE_TYPES,
  WEEKS,
  type ResourceType,
} from "@/lib/lr";
import {
  SCHOOLS_BY_SUB_OFFICE,
  SUB_OFFICES,
} from "@/lib/schools";

/** Upload form link for actual learning resource files. */
const UPLOAD_FORM_URL = "https://forms.cloud.microsoft/r/F4JCmdAfNx";

/** All learning resources are submitted by SDO Batangas. */
const SDO_BATANGAS = "SDO Batangas";

const formSchema = z.object({
  title: z.string().trim().min(3, "Enter the full resource title."),
  resourceType: z.string().min(1, "Select a resource type."),
  learningArea: z.string().min(1, "Select a learning area."),
  gradeLevel: z.string().min(1, "Select a grade level."),
  quarter: z.string().min(1, "Select a quarter."),
  week: z.string().min(1, "Select a week."),
  developer: z.string().trim().min(2, "Enter the developer's name."),
  position: z.string().min(1, "Select a position."),
  subOffice: z.string().min(1, "Select a sub-office."),
  school: z.string().min(1, "Select a school."),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitLRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewResourceInput) => void;
}

/**
 * Dialog for viewers to submit a learning resource with required details.
 * After recording the details, the viewer is directed to the upload form
 * to attach the actual resource files.
 */
export function SubmitLRDialog({ open, onOpenChange, onSubmit }: SubmitLRDialogProps) {
  const { user } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      resourceType: "",
      learningArea: "",
      gradeLevel: "",
      quarter: "",
      week: "",
      developer: "",
      position: "",
      school: "",
      subOffice: "",
    },
  });

  // Prefill from the viewer's registration (developer name, sub-office, school).
  useEffect(() => {
    if (!open) return;
    if (user?.name && !form.getValues("developer")) {
      form.setValue("developer", user.name);
    }
    if (user?.subOffice && !form.getValues("subOffice")) {
      form.setValue("subOffice", user.subOffice);
    }
    if (user?.school && !form.getValues("school")) {
      form.setValue("school", user.school);
    }
  }, [open, user, form]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      resourceType: values.resourceType as ResourceType,
      learningArea: values.learningArea,
      gradeLevel: values.gradeLevel,
      quarter: values.quarter,
      week: values.week,
      developer: values.developer,
      position: values.position,
      additionalAuthors: [],
      submittedByEmail: user?.email,
      division: SDO_BATANGAS,
      school: values.school,
      subOffice: values.subOffice,
    });
    toast.success("Learning resource details submitted", {
      description: "Please upload your resource files using the form link provided.",
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <UploadCloud className="h-5 w-5 text-primary" />
            Submit a Learning Resource
          </DialogTitle>
          <DialogDescription>
            Fill in the required details below to submit a learning resource.
            After submitting, you will be directed to the upload form to attach
            your resource files.
          </DialogDescription>
        </DialogHeader>

        {/* Upload form callout */}
        <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
          <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-900">
              Upload Your Resource Files
            </p>
            <p className="mt-0.5 text-xs text-sky-700">
              After submitting the details below, click the button to upload your
              learning resource files via the DepEd upload form.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 gap-2 border-sky-300 text-sky-700 hover:bg-sky-100"
              onClick={() => window.open(UPLOAD_FORM_URL, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Upload Form
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Solving Word Problems Involving Fractions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="resourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learningArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEARNING_AREAS.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_LEVELS.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUARTERS.map((quarter) => (
                          <SelectItem key={quarter} value={quarter}>
                            {quarter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEEKS.map((week) => (
                          <SelectItem key={week} value={week}>
                            {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="developer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Developer / Writer</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Juan A. Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subOffice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Office / Unit</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("school", "", { shouldValidate: false });
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-office" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUB_OFFICES.map((office) => (
                        <SelectItem key={office} value={office}>
                          {office}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="school"
              render={({ field }) => {
                const selectedSubOffice = form.watch("subOffice");
                const schools = selectedSubOffice
                  ? SCHOOLS_BY_SUB_OFFICE[selectedSubOffice] ?? []
                  : [];
                return (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubOffice}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSubOffice ? "Select school" : "Select a sub-office first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school} value={school}>
                            {school}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Schools Division Office
              </p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{SDO_BATANGAS}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All learning resources are submitted by SDO Batangas.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                <span className="font-semibold">Important:</span> After submitting
                these details, click{" "}
                <span className="font-semibold">"Open Upload Form"</span> above to
                upload your resource files. Your submission will not be complete
                until the files are uploaded.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
                <UploadCloud className="h-4 w-4" />
                Submit Details
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
