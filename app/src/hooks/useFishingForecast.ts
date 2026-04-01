import { useEffect, useState } from "react";
import { GlossaryTerm, Recommendation, SpotId } from "../domain/models";
import {
  getAvailableDates,
  getDailyRecommendations,
  getGlossary,
  getSpotDetail,
} from "../services/forecastService";
import { getTomorrowDateString } from "../lib/date";

export function useDailyRecommendations(selectedDate?: string) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [date, setDate] = useState(selectedDate ?? getTomorrowDateString());
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      const dates = await getAvailableDates();
      const normalizedDate = dates.includes(date) ? date : dates[0] ?? date;

      setAvailableDates(dates);
      setDate(normalizedDate);
      setLoading(true);
      const data = await getDailyRecommendations(normalizedDate);
      setRecommendations(data);
      setLoading(false);
    }

    void load();
  }, [date]);

  return {
    date,
    availableDates,
    recommendations,
    loading,
    setDate,
  };
}

export function useSpotRecommendation(spotId: SpotId, date: string) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof getSpotDetail>>>();

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true);
      const detail = await getSpotDetail(spotId, date);
      setResult(detail);
      setLoading(false);
    }

    void load();
  }, [spotId, date]);

  return {
    loading,
    spot: result?.spot,
    recommendation: result?.recommendation,
  };
}

export function useGlossaryTerms() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    async function load(): Promise<void> {
      const glossary = await getGlossary();
      setTerms(glossary);
    }

    void load();
  }, []);

  return terms;
}
