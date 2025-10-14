export type MediaType = 'movie' | 'tv';

export interface ProviderInfo {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface Availability {
  flatrate?: ProviderInfo[];
  buy?: ProviderInfo[];
  rent?: ProviderInfo[];
}

export interface UnifiedResultBase {
  id: number;
  media_type: MediaType;
  title: string;
  overview: string;
  poster_path: string | null;
  release_year?: number;
}

export interface UnifiedSearchResult extends UnifiedResultBase {
  providers?: Availability;
}

export interface CreditsResponse {
  cast: Array<{ id: number; name: string; character?: string; profile_path: string | null }>;
  crew: Array<{ id: number; name: string; job?: string; department?: string; profile_path: string | null }>;
}

export interface ExternalIdsResponse {
  imdb_id?: string | null;
}

export interface DetailResponse extends UnifiedResultBase {
  genres?: Array<{ id: number; name: string }>;
  runtime?: number; // movie
  episode_run_time?: number[]; // tv
  first_air_date?: string; // tv
  release_date?: string; // movie
}

export interface OmdbSummary {
  imdbID?: string;
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  imdbRating?: string;
  imdbVotes?: string;
}
