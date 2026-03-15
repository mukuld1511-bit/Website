"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export type SortBy       = "newest" | "popular" | "downloads";
export type PriceFilter  = "all" | "free" | "paid";
export type FormatFilter = "all" | "glb" | "gltf" | "obj" | "fbx" | "zip" | "dwg";

export interface GalleryFilters {
  sort:   SortBy;
  price:  PriceFilter;
  format: FormatFilter;
  search: string;
}

export function useGalleryFilters(): [GalleryFilters, (partial: Partial<GalleryFilters>) => void] {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const filters: GalleryFilters = {
    sort:   (searchParams.get("sort")   as SortBy)       || "newest",
    price:  (searchParams.get("price")  as PriceFilter)  || "all",
    format: (searchParams.get("format") as FormatFilter) || "all",
    search: searchParams.get("q") ?? "",
  };

  const setFilters = useCallback((partial: Partial<GalleryFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (partial.sort   !== undefined) params.set("sort",   partial.sort);
    if (partial.price  !== undefined) params.set("price",  partial.price);
    if (partial.format !== undefined) params.set("format", partial.format);
    if (partial.search !== undefined) {
      if (partial.search) params.set("q", partial.search);
      else params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return [filters, setFilters];
}
