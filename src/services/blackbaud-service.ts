
/**
 * @fileOverview Service for interacting with the Blackbaud SKY API.
 */

export interface BlackbaudGrade {
  course_name: string;
  course_code: string;
  numeric_grade: number;
  letter_grade: string;
  credits: number;
  section_id: string;
}

/**
 * fetches the current user's grades from blackbaud sky api.
 * requires a valid access token and subscription key.
 */
export async function fetchBlackbaudGrades(accessToken: string): Promise<BlackbaudGrade[]> {
  const subscriptionKey = process.env.BLACKBAUD_SUBSCRIPTION_KEY;

  if (!subscriptionKey) {
    throw new Error('Blackbaud Subscription Key not configured');
  }

  // note: this is a simplified endpoint path. blackbaud's actual paths 
  // vary by entity (K-12, Higher Ed, etc).
  const response = await fetch('https://api.sky.blackbaud.com/school/v1/grades', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Bb-Api-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`blackbaud api error: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  // map the blackbaud response to our internal structure
  return data.value || [];
}
