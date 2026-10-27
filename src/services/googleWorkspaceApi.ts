import { Lead } from "../types";

// ==========================================
// 1. GMAIL API SERVICES
// ==========================================

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function listGmailMessages(
  token: string, 
  maxResults = 10,
  query = ""
): Promise<GmailMessageSummary[]> {
  try {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set("maxResults", String(maxResults));
    if (query) url.searchParams.set("q", query);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API Error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.messages || data.messages.length === 0) return [];

    // Fetch details for top 5 messages for display
    const detailsPromises = data.messages.slice(0, 5).map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId, snippet: "" };
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
        const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || "",
          subject,
          from,
          date
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId, snippet: "" };
      }
    });

    return await Promise.all(detailsPromises);
  } catch (err: any) {
    console.error("Failed to list Gmail messages:", err);
    throw err;
  }
}

export async function sendGmailEmail(
  token: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string; threadId: string }> {
  try {
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      bodyText
    ];

    const raw = btoa(unescape(encodeURIComponent(emailLines.join("\r\n"))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to send email: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error("Failed sending Gmail message:", err);
    throw err;
  }
}

// ==========================================
// 2. GOOGLE DRIVE API SERVICES
// ==========================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export async function listDriveFiles(
  token: string, 
  pageSize = 20, 
  query = ""
): Promise<DriveFileItem[]> {
  try {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("fields", "files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)");
    url.searchParams.set("orderBy", "modifiedTime desc");
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.set("q", "trashed = false");
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    console.error("Failed to list Google Drive files:", err);
    throw err;
  }
}

export async function createDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder"
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder: ${res.status}`);
  }

  return await res.json();
}

export async function uploadDriveTextDocument(
  token: string,
  fileName: string,
  content: string,
  mimeType = "text/plain"
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    mimeType
  };

  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload document to Drive: ${res.status}`);
  }

  return await res.json();
}

export async function deleteDriveFile(token: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete Drive file: ${res.status}`);
  }

  return true;
}

// ==========================================
// 3. GOOGLE SHEETS API SERVICES
// ==========================================

export interface SpreadsheetInfo {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  spreadsheetUrl: string;
}

export async function createCrmGoogleSheet(
  token: string,
  title: string,
  leads: Lead[]
): Promise<SpreadsheetInfo> {
  const headers = [
    "Dossier ID",
    "Client Name",
    "Phone",
    "Email",
    "Firm Division",
    "Status",
    "Score",
    "Temperature",
    "Consultation Fee Status",
    "Consultation Retainer (INR)",
    "Service Keyword",
    "Assigned Counsel",
    "Booking Type",
    "Booking Status",
    "Creation Date"
  ];

  const rows = leads.map(l => [
    l.id,
    l.name,
    l.phone,
    l.email,
    l.type === "law" ? "Corporate Law" : "Tax & Accounting",
    l.status,
    l.score,
    l.temperature,
    l.consultationFee,
    l.consultationFee === "Paid" ? "₹1,499" : l.consultationFee === "Waived" ? "₹0" : "₹1,499 (Due)",
    l.keyword,
    l.assignedAgent || "Unassigned",
    l.bookingType || "None",
    l.bookingStatus || "None",
    new Date(l.createdAt).toLocaleDateString()
  ]);

  const requestBody = {
    properties: {
      title: title || `Company Docx CRM Leads - ${new Date().toLocaleDateString()}`
    },
    sheets: [
      {
        properties: {
          title: "CRM Leads & Financials",
          gridProperties: {
            rowCount: Math.max(leads.length + 10, 50),
            columnCount: headers.length + 2,
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.07, green: 0.12, blue: 0.18 },
                    horizontalAlignment: "CENTER"
                  }
                }))
              },
              ...rows.map(row => ({
                values: row.map(cell => ({
                  userEnteredValue: typeof cell === "number" 
                    ? { numberValue: cell } 
                    : { stringValue: String(cell) }
                }))
              }))
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Sheet: ${res.status}`);
  }

  return await res.json();
}

export async function getSpreadsheetValues(
  token: string,
  spreadsheetId: string,
  range = "A1:Z50"
): Promise<{ values: any[][] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read Google Sheet: ${res.status}`);
  }

  return await res.json();
}
