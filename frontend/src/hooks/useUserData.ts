import Cookies from 'js-cookie'

/**
 * Simple hook to fetch user data from cookies
 * @returns name, full_name, user_image - all strings
 */
export const useUserData = () => {
  const user_id = Cookies.get('user_id') ?? ''
  const full_name = Cookies.get('full_name') ?? ''
  const user_image = Cookies.get('user_image') ?? ''

  return {
    user_id,
    full_name,
    user_image,
  }
}