import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Replaces the legacy SectionPage / StudyPage block hub.
 * The Game Grid (`/learn`) is now the single discovery layer for terms,
 * activities and quizzes. Any old `/section/:id` or `/section/:id/study/:block`
 * links forward into the grid with the section auto-expanded.
 */
const SectionRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/learn${id ? `?section=${id}` : ""}`, { replace: true });
  }, [id, navigate]);

  return null;
};

export default SectionRedirect;
