// /pending is superseded by /merchant-preorders and /holding.
// This redirect preserves any existing bookmarks.
import { redirect } from "next/navigation";

export default function PendingRedirect() {
  redirect("/merchant-preorders");
}
