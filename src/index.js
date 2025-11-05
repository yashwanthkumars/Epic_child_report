import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getText', async (req) => {
  console.log(req);

  // Get the issue key from the request context
    const issueKey = req.context?.extension?.issue?.key;
    if (!issueKey) {
      console.warn('getText: no issue key in request context');
      return { error: 'No issue in context' };
    }

    // Build a JQL that finds issues with the current issue as their Epic
    const jql = `"Epic Link" = ${issueKey}`;
    const searchRes = await api.asApp().requestJira(route`/rest/api/3/search/jql?jql=${jql}`);
    const searchData = await searchRes.json();
  console.log('getLinkedIssues - searchData:', JSON.stringify(searchData, null, 2));
    console.log('Linked Issue Data:', searchData);
    return searchData;

});


// ==================

resolver.define('getLinkedIssues', async (req) => {
  console.log(req);

  // Array to store results for all linked issues
    const issueKey = req.context?.extension?.issue?.key;
    if (!issueKey) {
      console.warn('getLinkedIssues: no issue key in request context');
      return { error: 'No issue in context' };
    }

    const jql = `"Epic Link" = ${issueKey}`;
    const searchRes = await api.asApp().requestJira(route`/rest/api/3/search/jql?jql=${jql}`);
    const searchData = await searchRes.json();

    const linkedIssuesDetails = [];
    for (const issue of searchData.issues || []) {
      // If `issue.key` is missing, fall back to `issue.id` (issue endpoints accept either)
      const idOrKey = issue.key || issue.id;

      // Request only the fields we need to avoid field-level permission issues and be explicit
      const issueRes = await api.asApp().requestJira(route`/rest/api/3/issue/${idOrKey}?fields=summary,status`);
      const searchIssueData = await issueRes.json();
  

      // Extract fields safely
      const summary = searchIssueData.fields?.summary;
      const status = searchIssueData.fields?.status?.name;
      const issueKey = searchIssueData.key;

      // Log what we're about to push so the tunnel output shows the values
      console.log('getLinkedIssues - pushing detail for issue:', {
        issueId: issue.id,
        issueKey,
        summary,
        status,
      });

      linkedIssuesDetails.push({
        issueId: issue.id,
        issueKey,
        summary,
        status,
      });
    }

    console.log('getLinkedIssues - final linkedIssuesDetails:', JSON.stringify(linkedIssuesDetails, null, 2));

    // Compute stats: total child issues and how many are completed.
    const total = linkedIssuesDetails.length;
    const completed = linkedIssuesDetails.filter((i) => {
      // Consider status 'Success' (case-insensitive) as completed.
      const s = (i.status || '').toString().toLowerCase();
      return s === 'success';
    }).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const result = {
      items: linkedIssuesDetails,
      stats: {
        total,
        completed,
        percent,
      },
    };

    console.log('getLinkedIssues - stats:', JSON.stringify(result.stats, null, 2));

    return result;
});

export const handler = resolver.getDefinitions();
