import { verifyAccess, type ApiData } from 'flags';
import { getProviderData } from 'flags/next';
import { NextResponse, type NextRequest } from 'next/server';
import { plansFlag } from '../../../api/stripe/plans';
 
export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('Authorization'));
  if (!access) return NextResponse.json(null, { status: 401 });
 
  const providerData = getProviderData({
    plans: plansFlag,
  });
  
  return NextResponse.json<ApiData>(providerData);
}
