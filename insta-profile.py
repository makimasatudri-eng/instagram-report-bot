import httpx
import json
from user_agent import generate_user_agent as gg
import sys

def insta_profile(username: str, choice: int):
    result = {}

    url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"

    headers = {
        "x-ig-app-id": "936619743392459",
        "accept": "*/*",
        "user-agent": gg(),
        "referer": "https://www.instagram.com/",
        "accept-language": "en-US,en;q=0.9",
    }

    try:
        with httpx.Client(http2=True, headers=headers, timeout=15) as client:
            req = client.get(url)

        if req.status_code != 200:
            return {
                "Error": f"Status Code: {req.status_code}",
            }

        res = req.json()

        if choice == 1:
            user = res["data"]["user"]

            result = {
                "Message": "Profile Info",
                "Data": {
                    "Full Name": user.get("full_name", ""),
                    "Username": user.get("username", ""),
                    "Id": user.get("id", ""),
                    "Business Account": user.get("is_business_account", False),
                    "Creator Account": user.get("is_professional_account", False),
                    "Biography": user.get("biography", ""),
                    "Bio Link": user.get("external_url", ""),
                    "Followers": user["edge_followed_by"]["count"],
                    "Following": user["edge_follow"]["count"],
                    "Category": user.get("category_name", "N/A"),
                    "Media Count": user["edge_owner_to_timeline_media"]["count"],
                    "Profile Pic": user.get("profile_pic_url_hd", user.get("profile_pic_url", "")),
                },
            }

    except Exception as e:
        result = {"Error": str(e)}

    return result


def main():
    # Force UTF-8 encoding
    sys.stdout.reconfigure(encoding='utf-8')

    print("Welcome to Insta Profile Analyzer")
    print("=" * 60)

    username = input("Enter Username: ").strip()

    print("""Please Choose:
[1] Basic Profile Info""")

    choice = 1  # Force basic info

    data = insta_profile(username, choice)

    print("\nRESULT:")
    for k, v in data.items():
        if isinstance(v, dict):
            print(f"\n{k}:")
            for k2, v2 in v.items():
                print(f"  {k2} = {v2}")
        else:
            print(f"{k} = {v}")


if __name__ == "__main__":
    main()