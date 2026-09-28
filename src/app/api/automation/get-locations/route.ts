import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { refreshGoogleAccessToken } from '@/lib/gmbService';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch GBP account from our DB to get the refresh token
    const { data: gbpAccount, error: fetchErr } = await supabaseAdmin
      .from('gbp_accounts')
      .select('refresh_token')
      .eq('client_id', clientId)
      .single();

    if (fetchErr || !gbpAccount || !gbpAccount.refresh_token) {
      return NextResponse.json(
        { error: 'GMB connection profile not found. Please connect your Google account first.' },
        { status: 404 }
      );
    }

    const { refresh_token } = gbpAccount;

    // Check if it's an agency/mock token
    if (refresh_token.includes('mock') || refresh_token.includes('agency') || refresh_token === 'pending') {
      return NextResponse.json({
        locations: [
          { name: 'locations/mock_vizag_vizianagaram', title: 'Vizag IVF (Vizianagaram)' },
          { name: 'locations/mock_vizag_srikakulam', title: 'Vizag IVF (Srikakulam)' },
          { name: 'locations/mock_medcy_hyd', title: 'Medcy Hospitals (Hyderabad)' }
        ]
      });
    }

    // 2. Refresh the token
    const accessToken = await refreshGoogleAccessToken(refresh_token);

    // 3. Fetch all accounts this token has access to
    const accountsUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const accountsResponse = await axios.get(accountsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const accounts = accountsResponse.data.accounts || [];
    let allLocations: { name: string; title: string; storeCode?: string }[] = [];

    // 4. Fetch locations for each account
    for (const acc of accounts) {
      try {
        const locationsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,storeCode`;
        const locationsResponse = await axios.get(locationsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const locations = locationsResponse.data.locations || [];
        
        for (const loc of locations) {
          allLocations.push({
            name: loc.name,
            title: loc.title,
            storeCode: loc.storeCode
          });
        }
      } catch (locErr: any) {
        console.warn(`Failed to fetch locations for account "${acc.name}":`, locErr.message);
      }
    }

    return NextResponse.json({ locations: allLocations });

  } catch (error: any) {
    console.error('Failed to get GMB locations:', error.response?.data || error.message);
    
    // Check if the error is specifically a missing scope / permission denied error
    if (error.response?.status === 403 || error.response?.data?.error?.status === 'PERMISSION_DENIED') {
      return NextResponse.json(
        { error: 'Missing Permissions. You did not check the "Manage your business profiles" box when connecting your Google account. Please reconnect and check all boxes.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve locations from Google', details: error.message },
      { status: 500 }
    );
  }
}
