import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export type Review = {
  id: string;
  name: string;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt: string;
};

function mapReview(row: any): Review {
  return {
    id: String(row.id),
    name: String(row.name || "Patient"),
    rating: Number(row.rating || 5),
    message: String(row.message || ""),
    status: (row.status || "Pending") as ReviewStatus,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function getReviews(status?: ReviewStatus): Promise<Review[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("reviews")
    .select("id,name,rating,message,status,created_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapReview);
}

export async function addReview(input: {
  name: string;
  rating: number;
  message: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      name: input.name,
      rating: input.rating,
      message: input.message,
      status: "Pending",
    })
    .select("id,name,rating,message,status,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapReview(data);
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("reviews")
    .update({ status })
    .eq("id", id)
    .select("id,name,rating,message,status,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapReview(data);
}