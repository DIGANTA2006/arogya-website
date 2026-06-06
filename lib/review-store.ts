import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
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

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "reviews.json");

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

function mapSupabaseReview(row: any): Review {
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating || 5),
    message: row.message,
    status: row.status || "Pending",
    createdAt: row.created_at,
  };
}

export async function getReviews(status?: ReviewStatus): Promise<Review[]> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    let query = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (!error && data) {
      return data.map(mapSupabaseReview);
    }
  }

  await ensureFile();

  const raw = await readFile(filePath, "utf8");
  const reviews = JSON.parse(raw || "[]") as Review[];

  return status ? reviews.filter((review) => review.status === status) : reviews;
}

export async function addReview(input: {
  name: string;
  rating: number;
  message: string;
}) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        name: input.name,
        rating: input.rating,
        message: input.message,
        status: "Pending",
      })
      .select()
      .single();

    if (!error && data) {
      return mapSupabaseReview(data);
    }
  }

  await ensureFile();

  const reviews = await getReviews();

  const review: Review = {
    id: crypto.randomUUID(),
    name: input.name,
    rating: input.rating,
    message: input.message,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(review);
  await writeFile(filePath, JSON.stringify(reviews, null, 2), "utf8");

  return review;
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      return mapSupabaseReview(data);
    }
  }

  await ensureFile();

  const reviews = await getReviews();

  const updatedReviews = reviews.map((review) =>
    review.id === id ? { ...review, status } : review
  );

  await writeFile(filePath, JSON.stringify(updatedReviews, null, 2), "utf8");

  return updatedReviews.find((review) => review.id === id);
}
