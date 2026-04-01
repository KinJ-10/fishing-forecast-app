import { ReasonItem } from "../domain/models";

interface ReasonListProps {
  reasons: ReasonItem[];
}

export function ReasonList({ reasons }: ReasonListProps) {
  return (
    <ul className="reason-list">
      {reasons.map((reason) => (
        <li key={reason.id}>
          <strong>{reason.title}</strong>
          <span>{reason.summary}</span>
          <span className="reason-action">動き方: {reason.actionTip}</span>
        </li>
      ))}
    </ul>
  );
}
