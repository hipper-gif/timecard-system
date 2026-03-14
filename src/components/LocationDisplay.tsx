type Props = {
  latitude: number | null;
  longitude: number | null;
  label?: string;
};

export default function LocationDisplay({ latitude, longitude, label }: Props) {
  if (latitude == null || longitude == null) {
    return <span className="text-gray-400 text-xs">--</span>;
  }

  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
      title={`${label ? label + ": " : ""}${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {label ?? "地図"}
    </a>
  );
}
