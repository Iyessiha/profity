import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware versions of Next.js navigation primitives.
 * Use these instead of next/link, next/navigation redirect, etc.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
