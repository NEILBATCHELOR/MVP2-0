import Papa from "papaparse";

// Parse CSV file
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// Generate CSV content
export const generateCSV = (data: any[], headers: string[]): string => {
  // Create header row
  const headerRow = headers.join(",");

  // Create data rows
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header];
        // Wrap strings in quotes and handle special characters
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  // Combine header and rows
  return [headerRow, ...rows].join("\n");
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Sample KYC/AML CSV template
export const getKycCsvTemplate = (): string => {
  const headers = [
    "Name",
    "Email",
    "Type",
    "Company",
    "Country",
    "ID Number",
    "Date of Birth",
  ];
  const sampleData = [
    {
      Name: "John Smith",
      Email: "john.smith@example.com",
      Type: "individual",
      Company: "",
      Country: "US",
      "ID Number": "ABC123456",
      "Date of Birth": "1980-01-01",
    },
    {
      Name: "Acme Corporation",
      Email: "info@acmecorp.com",
      Type: "company",
      Company: "Acme Corporation",
      Country: "US",
      "ID Number": "DEF789012",
      "Date of Birth": "",
    },
  ];

  return generateCSV(sampleData, headers);
};

// Download KYC/AML CSV template
export const downloadKycCsvTemplate = (): void => {
  const csvContent = getKycCsvTemplate();
  downloadCSV(csvContent, "kyc_aml_template.csv");
};
