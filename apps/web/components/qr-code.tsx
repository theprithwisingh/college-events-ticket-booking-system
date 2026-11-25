"use client";

import React, { useMemo } from "react";

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildMatrix(payload: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const placeFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const row = matrix[top + r];
        if (row) row[left + c] = isBorder || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let seed = hashString(payload);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const row = matrix[r];
      if (row) row[c] = (seed & 1) === 1;
    }
  }
  return matrix;
}

export function QRCodeSVG({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const matrix = useMemo(() => buildMatrix(value, 25), [value]);
  const cells = matrix.length;

  return (
    <div
      className="inline-flex items-center justify-center rounded-xl border border-[#E7E5E0] bg-white p-4 shadow-xs"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cells} ${cells}`}
        role="img"
        aria-label={`QR code for ${value}`}
        shapeRendering="crispEdges"
      >
        <rect width={cells} height={cells} fill="#FFFFFF" />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="#111318"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}

export async function exportTicketPng(options: {
  eventTitle: string;
  dateTime: string;
  venue: string;
  tierName: string;
  isInternal: boolean;
  attendeeName: string;
  attendeeMeta: string;
  ticketCode: string;
  qrPayload: string;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fontFamily = getComputedStyle(document.body).fontFamily;
  const sans = `${fontFamily}, sans-serif`;
  const mono = `${fontFamily}, monospace`;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = options.isInternal ? "#D97706" : "#1D4ED8";
  ctx.fillRect(0, 0, canvas.width, 76);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 24px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText(
    options.isInternal
      ? "INTERNAL PASS — BRING PHYSICAL COLLEGE ID"
      : "EXTERNAL GUEST PASS — VALID GOVT ID",
    canvas.width / 2,
    47,
  );

  ctx.fillStyle = "#111318";
  ctx.font = `bold 36px ${sans}`;
  ctx.fillText(options.eventTitle.slice(0, 34), canvas.width / 2, 148);
  ctx.fillStyle = "#57534E";
  ctx.font = `22px ${sans}`;
  ctx.fillText(
    `${options.dateTime}  •  ${options.venue}`,
    canvas.width / 2,
    190,
  );

  const matrix = buildMatrix(options.qrPayload, 25);
  const cell = 14;
  const qrSize = matrix.length * cell;
  const startX = (canvas.width - qrSize) / 2;
  const startY = 250;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(startX - 24, startY - 24, qrSize + 48, qrSize + 48);
  ctx.strokeStyle = "#E7E5E0";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX - 24, startY - 24, qrSize + 48, qrSize + 48);

  ctx.fillStyle = "#111318";
  matrix.forEach((row, r) => {
    row.forEach((filled, c) => {
      if (filled) {
        ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell);
      }
    });
  });

  ctx.fillStyle = "#111318";
  ctx.font = `bold 34px ${mono}`;
  ctx.fillText(`CODE: ${options.ticketCode}`, canvas.width / 2, 678);

  ctx.font = `bold 32px ${sans}`;
  ctx.fillText(options.attendeeName, canvas.width / 2, 748);
  ctx.fillStyle = "#57534E";
  ctx.font = `24px ${mono}`;
  ctx.fillText(options.attendeeMeta, canvas.width / 2, 792);

  ctx.fillStyle = "#78716C";
  ctx.font = `20px ${sans}`;
  ctx.fillText(
    `${options.tierName} • CampusPass Gate Pass`,
    canvas.width / 2,
    880,
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
