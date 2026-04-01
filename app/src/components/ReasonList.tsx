interface ReasonListProps {
  reasons: string[];
}

export function ReasonList({ reasons }: ReasonListProps) {
  return (
    <ul className="reason-list">
      {reasons.map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
  );
}
