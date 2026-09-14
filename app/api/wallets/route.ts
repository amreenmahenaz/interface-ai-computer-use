import { Prisma } from "@prisma/client";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = body?.address;

    if (typeof address !== "string" || !ethers.utils.isAddress(address.trim())) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.trim().toLowerCase();
    const existingWallet = await prisma.wallet.findUnique({
      where: { address: normalizedAddress },
    });

    if (existingWallet) {
      return NextResponse.json(
        { wallet: existingWallet, created: false },
        { status: 200 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: { address: normalizedAddress },
    });

    return NextResponse.json(
      { wallet, created: true },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Wallet address already exists" },
        { status: 409 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    console.error("Failed to save wallet address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
