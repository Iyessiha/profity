"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "profity-theme";

type Theme = "dark" | "light";

/*
 * The theme lives on the document element, written before first paint by the
 * script in the root layout. React reads it as an external store rather than
 * mirroring it into state, so there is no second source of truth to drift and
 * no render pass spent catching up to the DOM.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** No attribute means no stated preference, and the app renders dark. */
function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle() {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage — the choice just won't persist.
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      {theme === "dark" ? "Clair" : "Sombre"}
    </Button>
  );
}
