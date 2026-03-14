import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CoinStats {
  coins: number;
  blocksMastered: number;
}

const SOUND_KEY = "cosmoprep_sounds_enabled";

export const useSoundsEnabled = () => {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored !== "false";
  });
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);
  return { soundsEnabled: enabled, toggleSounds: toggle };
};

const playCoinSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
};

const playLevelUpSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

export const useCoins = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CoinStats>({ coins: 0, blocksMastered: 0 });
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);
  const { soundsEnabled } = useSoundsEnabled();

  const fetchCoins = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_coins")
      .select("coins, blocks_mastered")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setStats({ coins: data.coins, blocksMastered: data.blocks_mastered });
    }
  }, [user]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const addCoins = useCallback(
    async (amount: number, type: "correct" | "reflection" | "audio" | "block_complete" = "correct") => {
      if (!user || amount <= 0) return;

      // Upsert coins
      const { data: existing } = await supabase
        .from("user_coins")
        .select("id, coins, blocks_mastered")
        .eq("user_id", user.id)
        .maybeSingle();

      const newCoins = (existing?.coins || 0) + amount;
      const newMastered = type === "block_complete"
        ? (existing?.blocks_mastered || 0) + 1
        : (existing?.blocks_mastered || 0);

      if (existing) {
        await supabase
          .from("user_coins")
          .update({ coins: newCoins, blocks_mastered: newMastered, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_coins")
          .insert({ user_id: user.id, coins: newCoins, blocks_mastered: newMastered });
      }

      setStats({ coins: newCoins, blocksMastered: newMastered });
      setLastAdded(amount);
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1500);

      if (soundsEnabled) {
        if (type === "block_complete") {
          playLevelUpSound();
        } else {
          playCoinSound();
        }
      }
    },
    [user, soundsEnabled]
  );

  return { stats, addCoins, showCoinAnimation, lastAdded, fetchCoins };
};
