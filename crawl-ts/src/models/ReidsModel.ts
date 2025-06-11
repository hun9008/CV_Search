

export const enum URLSTAUS
{ NOT_VISITED = 'not_visited',
  VISITED = 'visited',
  HAS_RECRUITINFO = 'has_recruit_info',
  NO_RECRUITINFO='no_recruit_info',
}

export class RedisKey {
  static ALLOWED_URL_PREFIX_KEY_BY_DOMAIN(domain: string): string {
    return `domain:${domain}:allowed_url_prefix`;
  }
  static URLSTATUS_KEY_BY_DOMAIN(domain: string ,status: URLSTAUS): string {
    return `domain:${domain}:${status}`;
  }

  static URLSTATUS_KEY(status: URLSTAUS): string {
    return status;
  }
  static SEED_URL_KEY_BY_DOMAIN(domain: string): string {
    return `domain:${domain}:seed_url`;
  }

  static DOMAINS_KEY(): string {
    return 'domains';
  }
}