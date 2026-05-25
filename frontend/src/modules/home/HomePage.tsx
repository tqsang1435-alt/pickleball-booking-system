"use client";

import { useEffect, useMemo, useState } from "react";
import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import FeaturedCourts from "./FeaturedCourts";
import FeaturedCoaches from "./FeaturedCoaches";
import AiSection from "./AiSection";
import { getCourts } from "@/services/courtApi";
import { getCoaches } from "@/services/coachApi";
import type { Court } from "@/types/court";
import type { Coach } from "@/types/coach";

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(true);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [courtsError, setCourtsError] = useState("");
  const [coachesError, setCoachesError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCourts() {
      try {
        setCourtsLoading(true);
        setCourtsError("");
        const data = await getCourts();
        if (mounted) setCourts(data);
      } catch (error) {
        if (mounted) {
          setCourtsError(error instanceof Error ? error.message : "Không tải được danh sách sân.");
        }
      } finally {
        if (mounted) setCourtsLoading(false);
      }
    }

    async function loadCoaches() {
      try {
        setCoachesLoading(true);
        setCoachesError("");
        const data = await getCoaches();
        if (mounted) setCoaches(data);
      } catch (error) {
        if (mounted) {
          setCoachesError(error instanceof Error ? error.message : "Không tải được danh sách Coach.");
        }
      } finally {
        if (mounted) setCoachesLoading(false);
      }
    }

    loadCourts();
    loadCoaches();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredCourts = useMemo(
    () => courts.filter((court) => court.Status === "Available").slice(0, 3),
    [courts]
  );

  const featuredCoaches = useMemo(
    () =>
      coaches
        .filter((coach) => ["Approved", "Active", "Available"].includes(String(coach.Status)))
        .sort((a, b) => Number(b.AverageRating || 0) - Number(a.AverageRating || 0))
        .slice(0, 3),
    [coaches]
  );

  return (
    <main>
      <HeroSection />
      <QuickActions />
      <FeaturedCourts
        courts={featuredCourts}
        loading={courtsLoading}
        error={courtsError}
      />
      <FeaturedCoaches
        coaches={featuredCoaches}
        loading={coachesLoading}
        error={coachesError}
      />
      <AiSection />
    </main>
  );
}
