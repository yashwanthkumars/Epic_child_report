import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

function App() {
  const [data, setData] = useState(null);
  const [linkedIssues, setLinkedIssues] = useState(null);

  // When calling the backend, log the raw response, update state, and
  // log any errors so the browser console shows what's returned.
  useEffect(() => {
    invoke('getText')
      .then((response) => {
        console.log('getText response (raw):', response);
        setData(response);
      })
      .catch((err) => console.error('getText error:', err));
  }, []);

  useEffect(() => {
    invoke('getLinkedIssues')
      .then((response) => {
        console.log('getLinkedIssues response (raw):', response);
        setLinkedIssues(response);
      })
      .catch((err) => console.error('getLinkedIssues error:', err));
  }, []);

  // Log state changes whenever they update (useful because setState is async)
  useEffect(() => {
    console.log('data state updated:', data);
  }, [data]);

  useEffect(() => {
    console.log('linkedIssues state updated:', linkedIssues);
  }, [linkedIssues]);

  // Helper to safely stringify for display in the UI
  const pretty = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  return (
    <div style={{ padding: 12, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <h3>Linked Child Issues Report</h3>
      {linkedIssues ? (
        // If backend returns an object with items and stats, render stats and list;
        // otherwise pretty-print whatever was returned.
        linkedIssues.items ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Total:</strong> {linkedIssues.stats.total} &nbsp; 
              <strong>Completed:</strong> {linkedIssues.stats.completed} &nbsp; 
              <strong>Percent Complete:</strong> {linkedIssues.stats.percent}%
            </div>

            {/* Progress bar: white background full width, blue fill according to percent */}
            <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e1e4e8', borderRadius: 6, height: 18, overflow: 'hidden', marginBottom: 10 }}>
              <div
                style={{
                  height: '100%',
                  width: `${linkedIssues.stats.percent}%`,
                  background: '#1f78d1',
                  transition: 'width 300ms ease',
                }}
              />
            </div>

            {/* Render human-friendly rows instead of raw JSON */}
            <div style={{ border: '1px solid #e6ecf1', borderRadius: 6, overflow: 'hidden' }}>
              {/* header */}
              <div style={{ display: 'flex', padding: '10px 12px', background: '#f4f6f8', fontWeight: 600 }}>
                <div style={{ flex: 1 }}>Work</div>
                <div style={{ width: 160 }}>Status</div>
              </div>

              {linkedIssues.items.map((item) => {
                const isDone = (item.status || '').toString().toLowerCase() === 'success';
                return (
                  <div key={item.issueId} style={{ display: 'flex', padding: '10px 12px', alignItems: 'center', borderTop: '1px solid #eee' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={isDone} readOnly style={{ marginRight: 12 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.issueKey || item.issueId}</div>
                        <div style={{ color: '#333', marginTop: 4 }}>{item.summary}</div>
                      </div>
                    </div>
                    <div style={{ width: 160 }}>{item.status || '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <pre style={{ background: '#f6f8fa', padding: 10, borderRadius: 4, overflowX: 'auto' }}>
            {pretty(linkedIssues)}
          </pre>
        )
      ) : (
        'Loading...'
      )}
    </div>
  );
}

export default App;
