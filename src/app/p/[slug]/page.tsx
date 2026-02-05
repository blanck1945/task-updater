import PersonaPageLoader from "./PersonaPageLoader";

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  return <PersonaPageLoader slug={decodedSlug} />;
}
