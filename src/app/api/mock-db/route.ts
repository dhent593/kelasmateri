import { NextResponse } from 'next/server';
import { getClientStore, saveClientStore, db as dbController } from '@/lib/db';

// This endpoint allows client-side components to query the server-side in-memory mock database.
// This guarantees 100% synchronization of users, questions, and sessions between Client and Server.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const db = getClientStore();

    switch (action) {
      case 'getUsers':
        return NextResponse.json(db.users);
      
      case 'getUserByEmail': {
        const email = searchParams.get('email')?.toLowerCase();
        const user = db.users.find(u => u.email.toLowerCase() === email) || null;
        return NextResponse.json(user);
      }
      
      case 'getUserById': {
        const id = searchParams.get('id');
        const user = db.users.find(u => u.id === id) || null;
        return NextResponse.json(user);
      }
      
      case 'getQuestions':
        return NextResponse.json(db.questions);
      
      case 'getExamSessions':
        return NextResponse.json(db.sessions);
      
      case 'getExamSessionById': {
        const id = searchParams.get('id');
        const session = db.sessions.find(s => s.id === id) || null;
        return NextResponse.json(session);
      }
      
      case 'getLatestSession': {
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const sorted = db.sessions
          .filter(s => s.user_id === userId && (!status || s.status === status))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return NextResponse.json(sorted[0] || null);
      }
      
      case 'getUserSessions': {
        const userId = searchParams.get('userId');
        const sorted = db.sessions
          .filter(s => s.user_id === userId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return NextResponse.json(sorted);
      }

      case 'getFullTryoutPackage': {
        const pkg = await dbController.getFullTryoutPackage();
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
    const db = getClientStore();

    switch (action) {
      case 'createUser': {
        const { email, role, id, password } = body;
        const newUser = {
          id: id || `user-${Math.random().toString(36).substr(2, 9)}`,
          email,
          role,
          can_generate_exam: email === 'admin@kelasmateri.com',
          created_at: new Date().toISOString(),
          password: password || 'palamana'
        };
        if (!db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          db.users.push(newUser);
          saveClientStore(db);
        }
        return NextResponse.json(newUser);
      }

      case 'updateUser': {
        const { id, updates } = body;
        const idx = db.users.findIndex(u => u.id === id);
        if (idx !== -1) {
          db.users[idx] = { ...db.users[idx], ...updates };
          saveClientStore(db);
          return NextResponse.json(db.users[idx]);
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      case 'deleteUser': {
        const { id } = body;
        const before = db.users.length;
        db.users = db.users.filter(u => u.id !== id);
        db.sessions = db.sessions.filter(s => s.user_id !== id);
        saveClientStore(db);
        return NextResponse.json({ success: db.users.length < before });
      }

      case 'createQuestion': {
        const { question } = body;
        const newQ = {
          ...question,
          id: `q-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        };
        db.questions.push(newQ);
        saveClientStore(db);
        return NextResponse.json(newQ);
      }

      case 'updateQuestion': {
        const { id, updates } = body;
        const idx = db.questions.findIndex(q => q.id === id);
        if (idx !== -1) {
          db.questions[idx] = { ...db.questions[idx], ...updates };
          saveClientStore(db);
          return NextResponse.json(db.questions[idx]);
        }
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      case 'deleteQuestion': {
        const { id } = body;
        const before = db.questions.length;
        db.questions = db.questions.filter(q => q.id !== id);
        saveClientStore(db);
        return NextResponse.json({ success: db.questions.length < before });
      }

      case 'createExamSession': {
        const { session } = body;
        const newS = {
          ...session,
          id: `sess-${Math.random().toString(36).substr(2, 9)}`,
          final_score: null,
          category_scores: null,
          created_at: new Date().toISOString(),
          completed_at: null
        };
        db.sessions.push(newS);
        saveClientStore(db);
        return NextResponse.json(newS);
      }

      case 'updateExamSession': {
        const { id, updates } = body;
        const idx = db.sessions.findIndex(s => s.id === id);
        if (idx !== -1) {
          if (updates.status === 'completed' && !updates.completed_at) {
            updates.completed_at = new Date().toISOString();
          }
          db.sessions[idx] = { ...db.sessions[idx], ...updates };
          saveClientStore(db);
          return NextResponse.json(db.sessions[idx]);
        }
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
