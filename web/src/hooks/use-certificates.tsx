import { useCallback, useEffect, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

import { supabase } from "@/lib/supabase";
import { type CertificateRequest, type CertificateRequestStatus } from "@/lib/certificate";

const COUNTER_ID = "certificate_slip";

interface CertRow {
  id: string;
  requester_name: string;
  requester_email: string;
  resource_id: string;
  resource_code: string;
  resource_title: string;
  resource_type: string;
  cert_name: string;
  cert_email: string | null;
  cert_position: string;
  cert_school: string;
  cert_date: string;
  status: string;
  slip_number: string;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

function mapRow(row: CertRow): CertificateRequest {
  return {
    id: row.id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    resourceId: row.resource_id,
    resourceCode: row.resource_code,
    resourceTitle: row.resource_title,
    resourceType: row.resource_type,
    certName: row.cert_name,
    certEmail: row.cert_email ?? "",
    certPosition: row.cert_position,
    certSchool: row.cert_school,
    certDate: row.cert_date,
    status: row.status as CertificateRequestStatus,
    slipNumber: row.slip_number,
    requestedAt: row.requested_at,
    processedAt: row.processed_at ?? undefined,
    processedBy: row.processed_by ?? undefined,
  };
}

/** Generate a sequential request slip number: RS-YYYY-NNNN */
function generateSlipNumber(counter: number): string {
  const year = new Date().getFullYear();
  const padded = String(counter + 1).padStart(4, "0");
  return `RS-${year}-${padded}`;
}

/** Fetch all certificate requests from Supabase, newest first. */
async function fetchRequests(): Promise<CertificateRequest[]> {
  const { data, error } = await supabase
    .from("certificate_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch certificate requests from Supabase", error);
    return [];
  }
  return (data as CertRow[]).map(mapRow);
}

/** Get the current slip counter from the app_counters table. */
async function fetchCounter(): Promise<number> {
  const { data, error } = await supabase
    .from("app_counters")
    .select("*")
    .eq("id", COUNTER_ID)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch certificate counter", error);
    return 0;
  }
  return (data as { value: number } | null)?.value ?? 0;
}

interface AddCertificateRequestInput {
  requesterName: string;
  requesterEmail: string;
  resourceId: string;
  resourceCode: string;
  resourceTitle: string;
  resourceType: string;
  certName: string;
  certEmail: string;
  certPosition: string;
  certSchool: string;
  certDate: string;
}

function useCertificatesProvider() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [counter, setCounter] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [data, cnt] = await Promise.all([fetchRequests(), fetchCounter()]);
      if (!cancelled) {
        setRequests(data);
        setCounter(cnt);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addRequest = useCallback(
    (input: AddCertificateRequestInput): CertificateRequest => {
      const slipNumber = generateSlipNumber(counter);
      const now = new Date().toISOString();
      const created: CertificateRequest = {
        ...input,
        id: crypto.randomUUID(),
        status: "pending",
        slipNumber,
        requestedAt: now,
      };
      setRequests((prev) => [created, ...prev]);
      setCounter((prev) => prev + 1);

      // Sync to Supabase
      (async () => {
        await supabase.from("certificate_requests").insert({
          id: created.id,
          requester_name: created.requesterName,
          requester_email: created.requesterEmail,
          resource_id: created.resourceId,
          resource_code: created.resourceCode,
          resource_title: created.resourceTitle,
          resource_type: created.resourceType,
          cert_name: created.certName,
          cert_email: created.certEmail,
          cert_position: created.certPosition,
          cert_school: created.certSchool,
          cert_date: created.certDate,
          status: created.status,
          slip_number: created.slipNumber,
          requested_at: created.requestedAt,
        });
        // Upsert counter
        await supabase
          .from("app_counters")
          .upsert({ id: COUNTER_ID, value: counter + 1, updated_at: now });
      })();
      return created;
    },
    [counter],
  );

  const updateRequestStatus = useCallback(
    (id: string, status: CertificateRequestStatus, processorName: string) => {
      const now = new Date().toISOString();
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status, processedAt: now, processedBy: processorName }
            : req,
        ),
      );

      // Sync to Supabase
      (async () => {
        await supabase
          .from("certificate_requests")
          .update({
            status,
            processed_at: now,
            processed_by: processorName,
          })
          .eq("id", id);
      })();
    },
    [],
  );

  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));

    // Sync to Supabase
    (async () => {
      await supabase.from("certificate_requests").delete().eq("id", id);
    })();
  }, []);

  /** Number of pending requests (for admin notifications). */
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return { requests, addRequest, updateRequestStatus, removeRequest, pendingCount, loading };
}

export const [CertificatesProvider, useCertificates] = createContextHook(useCertificatesProvider);
