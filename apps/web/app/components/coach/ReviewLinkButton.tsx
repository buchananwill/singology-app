import { Button } from "@mantine/core";
import { href, Link } from "react-router";

export interface ReviewLinkButtonProps {
  submissionId: string;
  label: string;
  studentName: string;
  itemTitle: string;
}

export function ReviewLinkButton({
  submissionId,
  label,
  studentName,
  itemTitle,
}: ReviewLinkButtonProps) {
  return (
    <Button
      component={Link}
      to={href("/coach/reviews/:submissionId", { submissionId })}
      size="sm"
      aria-label={`${label} ${studentName}'s ${itemTitle}`}
    >
      {label}
    </Button>
  );
}
