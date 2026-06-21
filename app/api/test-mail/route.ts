import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const result = await resend.emails.send({
      from:
        process.env.SUPPORT_FROM_EMAIL ??
        "Ser3bellum Support <info@ser3bellum.com>",
      to: [process.env.SUPPORT_EMAIL!],
      subject: "Ser3bellum Resend Test",
      html: "<p>Your email integration is working 🚀</p>",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error,
      },
      { status: 500 },
    );
  }
}