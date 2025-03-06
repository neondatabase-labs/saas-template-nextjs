import { getUserDetails } from '@/app/actions';
import { stackServerApp } from '@/stack';
import Link from 'next/link';
import Image from 'next/image';

export async function Header() {
  const user = await stackServerApp.getUser();
  const app = stackServerApp.urls;
  const userProfile = await getUserDetails(user?.id);

  return (
    <header className="w-full flex justify-between items-center px-6 py-4 z-10">
      <div className="font-medium text-[15px] tracking-tight">
        <Image
          src="/neon.svg"
          alt="Neon logo"
          width={102}
          height={28}
          priority
        />
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <span className='inline-flex h-8 items-end flex-col'>
          {userProfile?.name && <span className="text-[14px] text-gray-600 dark:text-gray-300">
            {`Hello, ${userProfile?.name.split(' ')[0]}`}
          </span>}
          <Link
            href={app.signOut}
            className="bg-gray-50 px-1 underline text-[11px]  hover:no-underline"
          >
            Sign Out
          </Link>
          </span>
          {
            userProfile?.raw_json.profile_image_url && 
            <Image 
              src={userProfile?.raw_json.profile_image_url}
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          }
            
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href={app.signIn}
            className="inline-flex h-8 items-center justify-center rounded-md px-4 text-[13px] font-medium text-gray-700 transition-all hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Log In
          </Link>
          <Link
            href={app.signUp}
            className="inline-flex h-8 items-center justify-center font-medium  text-center rounded-full outline-none   dark:text-black bg-primary-1 hover:bg-[#00e5bf] whitespace-nowrap px-6 text-[13px] transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}
