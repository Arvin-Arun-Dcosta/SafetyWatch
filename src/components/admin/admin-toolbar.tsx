"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";

import { type AdminSearch, adminHref } from "@/lib/admin-search";

/** Search box and reporter filter. Both update the URL; the server does the rest. */
export function AdminToolbar({ search }: { search: AdminSearch }) {
  const router = useRouter();
  const [query, setQuery] = useState(search.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    // Wait for a pause in typing before asking the server.
    timer.current = setTimeout(() => {
      router.replace(adminHref(search, { q: value.trim(), page: 1, apage: 1 }), { scroll: false });
    }, 300);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search reports..."
          aria-label="Search reports"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          aria-label="Filter by reporter"
          className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          value={search.reporter}
          onChange={(event) => {
            const reporter = event.target.value as AdminSearch["reporter"];
            router.replace(adminHref(search, { reporter, page: 1, apage: 1 }), { scroll: false });
          }}
        >
          <option value="all">All Reports</option>
          <option value="authenticated">Authenticated</option>
          <option value="anonymous">Anonymous</option>
        </select>
      </div>
    </div>
  );
}
