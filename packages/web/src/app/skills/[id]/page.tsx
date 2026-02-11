import type { InferPagePropsType } from 'next-typesafe-url';

import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';

import { BackLink } from '@/components/layout/back-link';
import { SkillDetailContent } from '@/components/skills/skill-detail-content';

import { Route } from './route-type';

async function SkillDetailPage({ routeParams }: InferPagePropsType<typeof Route>) {
  const { id } = await routeParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <BackLink href={$path({ route: '/' })} label="Back to skills" />
      <SkillDetailContent id={id} />
    </main>
  );
}

export default withParamValidation(SkillDetailPage, Route);
