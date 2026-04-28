import { NextRequest, NextResponse } from 'next/server';
import { changePassword } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '旧密码和新密码都不能为空' },
        { status: 400 }
      );
    }

    const result = await changePassword(oldPassword, newPassword);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '密码修改成功',
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || '修改密码失败' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: '修改密码失败' },
      { status: 500 }
    );
  }
}