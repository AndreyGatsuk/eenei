#import <Foundation/Foundation.h>
// Preview the active projects.
@interface Project : NSObject
@property NSString *name;
@end
@implementation Project
- (NSString *)label {
    if (self.name.length > 0) {
        return [@"Project: " stringByAppendingString:self.name];
    }
    return @"Archived";
}
@end
