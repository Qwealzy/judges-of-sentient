import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';
import { getRandomDescription } from '@/lib/descriptions';
import type { PledgeResult } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE_NAME = 'pledges';
const STORAGE_BUCKET = 'pledge-avatars';

type ServiceClient = ReturnType<typeof createClient>;

function getServiceClient(): ServiceClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false
    }
  });
}

function buildResult(payload: any): PledgeResult {
  return {
    id: payload.id,
    username: payload.username,
    profile_image_url: payload.profile_image_url,
    description: payload.description,
    created_at: payload.created_at
  };
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const results = (data ?? []).map(buildResult);

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Failed to load pledges', error);
    return NextResponse.json({ error: 'Unable to load Sentient pledges right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawUsername = formData.get('username');
    const avatar = formData.get('avatar');

    if (typeof rawUsername !== 'string' || !rawUsername.trim()) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    if (!(avatar instanceof File)) {
      return NextResponse.json({ error: 'Profile photo is required.' }, { status: 400 });
    }

    const username = rawUsername.trim();
    const supabase = getServiceClient();

    const extension = avatar.name.split('.').pop()?.toLowerCase() ?? 'png';
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, buffer, {
      cacheControl: '3600',
      contentType: avatar.type || `image/${extension}`,
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

    const description = getRandomDescription();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        username,
        profile_image_url: publicUrl,
        description
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const result = buildResult(data);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to submit pledge', error);
    return NextResponse.json(
      { error: 'Unable to submit your pledge. Double-check your configuration and try again.' },
      { status: 500 }
    );
  }
}
