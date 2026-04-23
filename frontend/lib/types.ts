export interface Link {
  id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  short_url: string;
  created_at: string;
  is_active: boolean;
  total_clicks: number;
}

export interface Click {
  id: string;
  clicked_at: string;
  ip_address: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  is_deep_link: boolean;
  app_target: string | null;
  referer: string | null;
}

export interface LinkStats {
  link: Link;
  clicks: Click[];
  stats: {
    total_clicks: number;
    unique_visitors: number;
    devices: {
      mobile: number;
      desktop: number;
      tablet: number;
    };
    platforms: {
      ios: number;
      android: number;
    };
    deep_link_opens: number;
    top_browsers: Record<string, number>;
    top_referers: Record<string, number>;
  };
}

export interface OverviewStats {
  total_links: number;
  total_clicks: number;
  deep_link_opens: number;
}

export interface LinkListResponse {
  links: Link[];
  total: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
