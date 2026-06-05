export const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
};

export const sendCSV = (res, filename, data) => {
  const csv = convertToCSV(data);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.send(csv);
};