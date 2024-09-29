export function readCookie(cookieName: string, cookies: string[] | undefined) {
  const cookieValueRegex = new RegExp(`${cookieName}=(?<cookieValue>[^;]+)`);

  const cookie = cookies?.find((cookie) => cookieValueRegex.test(cookie));

  if (!cookie) {
    return undefined;
  }

  const cookieValueMatch = cookie?.match(cookieValueRegex);
  const cookieValue = cookieValueMatch?.groups?.cookieValue ?? '';

  const cookiePropertiesMap = new Map<string, string>();

  const cookiePropertyRegex = /(?<property>[^=; ]+)(?:=(?<value>[^;]+))?/g;
  const cookiePropertyMatches = cookie?.matchAll(cookiePropertyRegex) ?? [];

  for (const match of cookiePropertyMatches) {
    const { property, value = '' } = match.groups!;
    cookiePropertiesMap.set(property, value);
  }

  return {
    raw: cookie,
    value: cookieValue,
    properties: cookiePropertiesMap,
  };
}
