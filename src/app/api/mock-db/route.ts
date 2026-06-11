import { NextResponse } from 'next/server';
import { db as dbController } from '@/lib/db';

// This endpoint allows client-side components to query the database (Supabase or fallback local JSON)
// via server-side execution. This ensures client components can access the database safely.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'getUsers': {
        const users = await dbController.getUsers();
        return NextResponse.json(users);
      }
      
      case 'getUserByEmail': {
        const email = searchParams.get('email')?.toLowerCase();
        if (!email) return NextResponse.json(null);
        const user = await dbController.getUserByEmail(email);
        return NextResponse.json(user);
      }
      
      case 'getUserById': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json(null);
        const user = await dbController.getUserById(id);
        return NextResponse.json(user);
      }
      
      case 'getQuestions': {
        const questions = await dbController.getQuestions();
        return NextResponse.json(questions);
      }
      
      case 'getExamSessions': {
        const sessions = await dbController.getExamSessions();
        return NextResponse.json(sessions);
      }
      
      case 'getExamSessionById': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json(null);
        const session = await dbController.getExamSessionById(id);
        return NextResponse.json(session);
      }
      
      case 'getLatestSession': {
        const userId = searchParams.get('userId');
        const status = searchParams.get('status') as any;
        if (!userId) return NextResponse.json(null);
        const session = await dbController.getLatestSession(userId, status);
        return NextResponse.json(session);
      }
      
      case 'getUserSessions': {
        const userId = searchParams.get('userId');
        if (!userId) return NextResponse.json([]);
        const sessions = await dbController.getUserSessions(userId);
        return NextResponse.json(sessions);
      }

      case 'getFullTryoutPackage': {
        const pkg = await dbController.getFullTryoutPackage();
        return NextResponse.json(pkg);
      }

      case 'getTrialTryoutPackage': {
        const pkg = await dbController.getTrialTryoutPackage();
        return NextResponse.json(pkg);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'createUser': {
        const { email, role, id, password } = body;
        const newUser = await dbController.createUser(email, role, id, password);
        return NextResponse.json(newUser);
      }

      case 'updateUser': {
        const { id, updates } = body;
        const updated = await dbController.updateUser(id, updates);
        if (updated) {
          return NextResponse.json(updated);
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      case 'deleteUser': {
        const { id } = body;
        const success = await dbController.deleteUser(id);
        return NextResponse.json({ success });
      }

      case 'createQuestion': {
        const { question } = body;
        const newQ = await dbController.createQuestion(question);
        return NextResponse.json(newQ);
      }

      case 'updateQuestion': {
        const { id, updates } = body;
        const updated = await dbController.updateQuestion(id, updates);
        if (updated) {
          return NextResponse.json(updated);
        }
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      case 'deleteQuestion': {
        const { id } = body;
        const success = await dbController.deleteQuestion(id);
        return NextResponse.json({ success });
      }

      case 'createExamSession': {
        const { session } = body;
        const newS = await dbController.createExamSession(session);
        return NextResponse.json(newS);
      }

      case 'updateExamSession': {
        const { id, updates } = body;
        const updated = await dbController.updateExamSession(id, updates);
        if (updated) {
          return NextResponse.json(updated);
        }
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      case 'deleteExamSession': {
        const { id } = body;
        const success = await dbController.deleteExamSession(id);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
