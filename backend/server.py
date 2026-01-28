from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Educational domain patterns
ALLOWED_EMAIL_DOMAINS = [
    r'\.edu$', r'\.edu\.\w+$', r'\.ac\.\w+$', r'@iit\w*\.', r'@nit\w*\.',
    r'@bits-pilani\.', r'@vit\.', r'@manipal\.', r'@amity\.', r'@srm\.',
    r'@iisc\.', r'@iiit\w*\.', r'\.college$', r'\.university$'
]

def is_valid_edu_email(email: str) -> bool:
    """Check if email belongs to educational domain"""
    email_lower = email.lower()
    # For demo purposes, also allow common domains
    demo_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    domain = email_lower.split('@')[-1]
    if domain in demo_domains:
        return True
    for pattern in ALLOWED_EMAIL_DOMAINS:
        if re.search(pattern, email_lower):
            return True
    return False

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: Optional[str] = None
    points: int = 0
    level: str = "Beginner"
    created_at: str

class RoleUpdate(BaseModel):
    role: str

class TaskSubmission(BaseModel):
    task_id: str
    code: str
    explanation: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

class CodeRunRequest(BaseModel):
    code: str
    task_id: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ DSA ARRAYS DATA ============

ARRAYS_TASKS = [
    {
        "id": "arr-001",
        "title": "Two Sum",
        "difficulty": "Easy",
        "points": 10,
        "type": "coding",
        "description": """Given an array of integers and a target sum, find two numbers that add up to the target.

**Your Task:** Return the indices of two numbers that sum to target.

**Example:**
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (because nums[0] + nums[1] = 2 + 7 = 9)

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists

**Think about:**
- What's the brute force approach? What's its time complexity?
- Can you do better with a hash map?""",
        "starter_code": """def two_sum(nums, target):
    # Your code here
    pass

# Test your solution
print(two_sum([2, 7, 11, 15], 9))  # Expected: [0, 1]
print(two_sum([3, 2, 4], 6))  # Expected: [1, 2]""",
        "test_cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected": [0, 1]},
            {"input": {"nums": [3, 2, 4], "target": 6}, "expected": [1, 2]},
            {"input": {"nums": [3, 3], "target": 6}, "expected": [0, 1]}
        ],
        "hints": [
            "Start with the simplest approach: check every pair",
            "A hash map can help you find complements in O(1)",
            "Think about what you need to store as you iterate"
        ],
        "solution_explanation": """**Approach 1: Brute Force O(n²)**
Check every pair of numbers. Simple but slow.

**Approach 2: Hash Map O(n)**
As you traverse, store each number and its index. For each number, check if (target - num) exists in your map.

```python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

**Why this works:** We're essentially asking "Have I seen the number that would complete this sum?" at each step."""
    },
    {
        "id": "arr-002",
        "title": "Maximum Subarray",
        "difficulty": "Medium",
        "points": 20,
        "type": "coding",
        "description": """Find the contiguous subarray with the largest sum.

**Your Task:** Return the maximum sum possible from any contiguous subarray.

**Example:**
Input: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6 (subarray [4, -1, 2, 1] has the largest sum)

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4

**Think about:**
- At each position, should you extend the previous subarray or start fresh?
- This is a classic dynamic programming problem (Kadane's Algorithm)""",
        "starter_code": """def max_subarray(nums):
    # Your code here
    pass

# Test your solution
print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # Expected: 6
print(max_subarray([1]))  # Expected: 1
print(max_subarray([5, 4, -1, 7, 8]))  # Expected: 23""",
        "test_cases": [
            {"input": {"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}, "expected": 6},
            {"input": {"nums": [1]}, "expected": 1},
            {"input": {"nums": [5, 4, -1, 7, 8]}, "expected": 23}
        ],
        "hints": [
            "At each element, you have two choices: start fresh or continue",
            "Track the best ending at current position",
            "The answer is the maximum of all 'best endings'"
        ],
        "solution_explanation": """**Kadane's Algorithm O(n)**

The key insight: at each position, the maximum subarray ending here is either:
1. Just the current element (start fresh)
2. Current element + max subarray ending at previous position (extend)

```python
def max_subarray(nums):
    max_ending_here = max_so_far = nums[0]
    for num in nums[1:]:
        max_ending_here = max(num, max_ending_here + num)
        max_so_far = max(max_so_far, max_ending_here)
    return max_so_far
```

**Time: O(n), Space: O(1)** - You only need to track two values!"""
    },
    {
        "id": "arr-003",
        "title": "Rotate Array",
        "difficulty": "Medium",
        "points": 20,
        "type": "coding",
        "description": """Rotate an array to the right by k steps.

**Your Task:** Modify the array in-place to rotate it.

**Example:**
Input: nums = [1, 2, 3, 4, 5, 6, 7], k = 3
Output: [5, 6, 7, 1, 2, 3, 4]

**Constraints:**
- 1 <= nums.length <= 10^5
- -2^31 <= nums[i] <= 2^31 - 1
- 0 <= k <= 10^5

**Think about:**
- What happens when k > length?
- Can you do it in O(1) extra space?
- The reverse trick is elegant!""",
        "starter_code": """def rotate(nums, k):
    # Your code here - modify nums in-place
    pass

# Test your solution
arr1 = [1, 2, 3, 4, 5, 6, 7]
rotate(arr1, 3)
print(arr1)  # Expected: [5, 6, 7, 1, 2, 3, 4]

arr2 = [-1, -100, 3, 99]
rotate(arr2, 2)
print(arr2)  # Expected: [3, 99, -1, -100]""",
        "test_cases": [
            {"input": {"nums": [1, 2, 3, 4, 5, 6, 7], "k": 3}, "expected": [5, 6, 7, 1, 2, 3, 4]},
            {"input": {"nums": [-1, -100, 3, 99], "k": 2}, "expected": [3, 99, -1, -100]}
        ],
        "hints": [
            "k = k % len(nums) handles large k values",
            "Try reversing: whole array, then first k, then rest",
            "Three reverses = one rotation!"
        ],
        "solution_explanation": """**Reverse Method O(n) time, O(1) space**

The trick: reverse three times!
1. Reverse entire array: [7,6,5,4,3,2,1]
2. Reverse first k: [5,6,7,4,3,2,1]
3. Reverse rest: [5,6,7,1,2,3,4]

```python
def rotate(nums, k):
    n = len(nums)
    k = k % n  # Handle k > n
    
    def reverse(start, end):
        while start < end:
            nums[start], nums[end] = nums[end], nums[start]
            start += 1
            end -= 1
    
    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
```

**Why it works:** Reversing is like flipping. Three strategic flips give you rotation!"""
    },
    {
        "id": "arr-004",
        "title": "Contains Duplicate",
        "difficulty": "Easy",
        "points": 10,
        "type": "coding",
        "description": """Check if any value appears at least twice in the array.

**Your Task:** Return True if duplicates exist, False otherwise.

**Example:**
Input: nums = [1, 2, 3, 1]
Output: True

Input: nums = [1, 2, 3, 4]
Output: False

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9

**Think about:**
- Sets have O(1) lookup - how can you use that?
- What's the trade-off between time and space?""",
        "starter_code": """def contains_duplicate(nums):
    # Your code here
    pass

# Test your solution
print(contains_duplicate([1, 2, 3, 1]))  # Expected: True
print(contains_duplicate([1, 2, 3, 4]))  # Expected: False
print(contains_duplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2]))  # Expected: True""",
        "test_cases": [
            {"input": {"nums": [1, 2, 3, 1]}, "expected": True},
            {"input": {"nums": [1, 2, 3, 4]}, "expected": False},
            {"input": {"nums": [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]}, "expected": True}
        ],
        "hints": [
            "A set only keeps unique values",
            "If set size != array size, there are duplicates",
            "Or check while building the set"
        ],
        "solution_explanation": """**Set Approach O(n)**

```python
def contains_duplicate(nums):
    return len(nums) != len(set(nums))
```

Or more explicitly:
```python
def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False
```

**Time: O(n), Space: O(n)** - You need space to track what you've seen."""
    },
    {
        "id": "arr-005",
        "title": "Product of Array Except Self",
        "difficulty": "Medium",
        "points": 25,
        "type": "coding",
        "description": """Given an array nums, return an array where each element is the product of all other elements.

**Your Task:** Solve it WITHOUT using division and in O(n) time.

**Example:**
Input: nums = [1, 2, 3, 4]
Output: [24, 12, 8, 6]
Explanation: 
- result[0] = 2*3*4 = 24
- result[1] = 1*3*4 = 12
- result[2] = 1*2*4 = 8
- result[3] = 1*2*3 = 6

**Constraints:**
- 2 <= nums.length <= 10^5
- -30 <= nums[i] <= 30
- Product fits in 32-bit integer

**Think about:**
- For each position, you need product of left side × product of right side
- Can you precompute these?""",
        "starter_code": """def product_except_self(nums):
    # Your code here - no division allowed!
    pass

# Test your solution
print(product_except_self([1, 2, 3, 4]))  # Expected: [24, 12, 8, 6]
print(product_except_self([-1, 1, 0, -3, 3]))  # Expected: [0, 0, 9, 0, 0]""",
        "test_cases": [
            {"input": {"nums": [1, 2, 3, 4]}, "expected": [24, 12, 8, 6]},
            {"input": {"nums": [-1, 1, 0, -3, 3]}, "expected": [0, 0, 9, 0, 0]}
        ],
        "hints": [
            "Think about prefix products (products from left)",
            "Think about suffix products (products from right)",
            "Each answer = prefix[i-1] × suffix[i+1]"
        ],
        "solution_explanation": """**Two Pass Approach O(n) time, O(1) extra space**

Pass 1: Build products from the left
Pass 2: Multiply with products from the right

```python
def product_except_self(nums):
    n = len(nums)
    result = [1] * n
    
    # Left products
    left = 1
    for i in range(n):
        result[i] = left
        left *= nums[i]
    
    # Right products (multiply into result)
    right = 1
    for i in range(n - 1, -1, -1):
        result[i] *= right
        right *= nums[i]
    
    return result
```

**The insight:** result[i] = (product of all left) × (product of all right)"""
    }
]

CONCEPT_TASKS = [
    {
        "id": "concept-001",
        "title": "Explain Array Traversal",
        "type": "concept",
        "points": 5,
        "description": "In your own words, explain what array traversal means and when you'd use it. Give a real-world analogy.",
        "hint": "Think about going through a list of items one by one..."
    },
    {
        "id": "concept-002", 
        "title": "Time Complexity Analysis",
        "type": "concept",
        "points": 5,
        "description": "Explain the difference between O(n) and O(n²) time complexity using array operations as examples.",
        "hint": "Compare a single loop vs nested loops..."
    }
]

DEBUG_TASKS = [
    {
        "id": "debug-001",
        "title": "Fix the Reverse Function",
        "type": "debugging",
        "points": 15,
        "description": """This function should reverse an array in-place, but it has bugs. Find and fix them!

```python
def reverse_array(arr):
    left = 0
    right = len(arr)  # Bug 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        # Missing: right -= 1  # Bug 2
    return arr
```

**Test:** reverse_array([1, 2, 3, 4, 5]) should return [5, 4, 3, 2, 1]""",
        "starter_code": """def reverse_array(arr):
    left = 0
    right = len(arr)
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
    return arr

# Test - this will fail with the buggy code
print(reverse_array([1, 2, 3, 4, 5]))""",
        "hints": [
            "Array indices go from 0 to len-1",
            "Both pointers need to move"
        ]
    }
]

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    if not is_valid_edu_email(user.email):
        raise HTTPException(status_code=400, detail="Please use a valid educational email (.edu, .ac.in, etc.) or a demo email")
    
    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email.lower(),
        "name": user.name,
        "password_hash": hash_password(user.password),
        "role": None,
        "points": 0,
        "level": "Beginner",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "progress": {},
        "weekly_activity": {"leetcode": 0, "github": 0, "linkedin": 0}
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email.lower(),
            "name": user.name,
            "role": None,
            "points": 0,
            "level": "Beginner"
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role"),
            "points": user.get("points", 0),
            "level": user.get("level", "Beginner")
        }
    }

# ============ USER ROUTES ============

@api_router.get("/users/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role"),
        "points": user.get("points", 0),
        "level": user.get("level", "Beginner"),
        "progress": user.get("progress", {}),
        "weekly_activity": user.get("weekly_activity", {})
    }

@api_router.put("/users/role")
async def update_role(role_data: RoleUpdate, user: dict = Depends(get_current_user)):
    valid_roles = ["SDE", "Data Analyst", "Data Scientist", "ML Engineer"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"role": role_data.role}}
    )
    return {"message": "Role updated", "role": role_data.role}

# ============ SKILLS/TASKS ROUTES ============

@api_router.get("/skills/dsa/arrays")
async def get_arrays_tasks(user: dict = Depends(get_current_user)):
    user_progress = user.get("progress", {})
    
    all_tasks = ARRAYS_TASKS + CONCEPT_TASKS + DEBUG_TASKS
    tasks_with_progress = []
    
    for task in all_tasks:
        task_copy = task.copy()
        task_copy["completed"] = user_progress.get(task["id"], {}).get("completed", False)
        task_copy["attempts"] = user_progress.get(task["id"], {}).get("attempts", 0)
        tasks_with_progress.append(task_copy)
    
    return {
        "module": "Arrays",
        "track": "DSA",
        "total_tasks": len(all_tasks),
        "completed_tasks": sum(1 for t in tasks_with_progress if t["completed"]),
        "tasks": tasks_with_progress
    }

@api_router.get("/skills/dsa/arrays/{task_id}")
async def get_task_detail(task_id: str, user: dict = Depends(get_current_user)):
    all_tasks = ARRAYS_TASKS + CONCEPT_TASKS + DEBUG_TASKS
    task = next((t for t in all_tasks if t["id"] == task_id), None)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_progress = user.get("progress", {}).get(task_id, {})
    task_copy = task.copy()
    task_copy["completed"] = user_progress.get("completed", False)
    task_copy["attempts"] = user_progress.get("attempts", 0)
    task_copy["last_submission"] = user_progress.get("last_submission")
    
    return task_copy

@api_router.post("/tasks/{task_id}/submit")
async def submit_task(task_id: str, submission: TaskSubmission, user: dict = Depends(get_current_user)):
    all_tasks = ARRAYS_TASKS + CONCEPT_TASKS + DEBUG_TASKS
    task = next((t for t in all_tasks if t["id"] == task_id), None)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update progress
    progress_key = f"progress.{task_id}"
    current_progress = user.get("progress", {}).get(task_id, {"attempts": 0, "completed": False})
    
    new_progress = {
        "attempts": current_progress.get("attempts", 0) + 1,
        "completed": True,
        "last_submission": datetime.now(timezone.utc).isoformat(),
        "code": submission.code
    }
    
    # Award points if first completion
    points_earned = 0
    if not current_progress.get("completed"):
        points_earned = task.get("points", 10)
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {progress_key: new_progress},
                "$inc": {"points": points_earned}
            }
        )
        
        # Update level based on total points
        updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        new_level = "Beginner"
        total_points = updated_user.get("points", 0)
        if total_points >= 100:
            new_level = "Advanced"
        elif total_points >= 50:
            new_level = "Intermediate"
        
        await db.users.update_one({"id": user["id"]}, {"$set": {"level": new_level}})
    else:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {progress_key: new_progress}}
        )
    
    return {
        "success": True,
        "points_earned": points_earned,
        "message": "Great work! Task completed." if points_earned > 0 else "Submission recorded."
    }

# ============ BRO MENTOR ROUTE ============

@api_router.post("/bro/chat")
async def chat_with_bro(message: ChatMessage, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    system_prompt = """You are BRO, an open-source AI mentor for college students preparing for tech placements. 

Your personality:
- Friendly and supportive like a senior engineer friend
- Use casual but professional language
- Never spoon-feed answers - guide students to think
- Give hints and ask guiding questions
- Explain concepts in simple, relatable terms
- Use analogies from real life
- Be encouraging but realistic
- Share interview tips when relevant

Rules:
- Never give complete code solutions directly
- Ask "What have you tried?" before helping
- Break down complex problems into smaller steps
- Celebrate small wins
- If someone's stuck, give hints not answers
- Keep responses concise but helpful

You're helping students with: DSA (Arrays module), Python coding, interview prep.
Current user: """ + user.get("name", "Student") + f" (Level: {user.get('level', 'Beginner')})"

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"bro-{user['id']}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=message.message)
        response = await chat.send_message(user_message)
        
        # Store chat in DB for history
        chat_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "message": message.message,
            "response": response,
            "context": message.context,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_doc)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"BRO chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="BRO is taking a coffee break. Try again!")

@api_router.get("/bro/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    history = await db.chat_history.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    return {"history": history}

# ============ CODE EXECUTION (MOCK) ============

@api_router.post("/code/run")
async def run_code(request: CodeRunRequest, user: dict = Depends(get_current_user)):
    """Mock code execution - returns simulated output"""
    code = request.code
    
    # Basic safety check
    dangerous_keywords = ["import os", "import subprocess", "exec(", "eval(", "open(", "__import__"]
    for kw in dangerous_keywords:
        if kw in code:
            return {
                "success": False,
                "output": "",
                "error": f"Security Error: '{kw}' is not allowed in this environment.",
                "explanation": "For safety, some Python features are restricted. Focus on the algorithm!"
            }
    
    # Simulate execution with predefined outputs based on task
    mock_outputs = {
        "two_sum": "For two_sum: Think about using a hash map to track complements!",
        "max_subarray": "For max_subarray: Kadane's algorithm is your friend here!",
        "rotate": "For rotate: The reverse trick works beautifully!",
        "contains_duplicate": "For contains_duplicate: Sets are O(1) lookup!",
        "product_except_self": "For product_except_self: Think prefix and suffix products!",
    }
    
    # Check if code has print statements
    if "print(" in code:
        # Simple mock - in production, use Pyodide or a sandboxed executor
        return {
            "success": True,
            "output": "Code executed! (Output simulation in demo mode)\n\nTip: Use the 'Submit' button to validate your solution against test cases.",
            "error": None,
            "explanation": "In demo mode, we show guidance instead of actual execution. Real execution uses Pyodide."
        }
    
    return {
        "success": True,
        "output": "No output. Add print() statements to see results.",
        "error": None
    }

# ============ ROOT ROUTE ============

@api_router.get("/")
async def root():
    return {"message": "EdTech API is running", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
