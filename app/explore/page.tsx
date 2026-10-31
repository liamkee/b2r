import { redirect } from "next/navigation";

/**
 * `/explore` was merged into the home page's map section. Old links land on
 * that section instead of breaking.
 */
export default function ExploreRedirect(): never {
  redirect("/#explore");
}